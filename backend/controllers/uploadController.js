const fs = require('fs');
const ExcelRecord = require('../models/ExcelRecord');
const Invoice = require('../models/Invoice');
const { parseExcel } = require('../utils/excelParser');
const { parseDate, parseNumber } = require('../services/excelService');

const COLUMN_ALIASES = {
  customer: ['customer', 'customer name', 'client', 'client name'],
  spoc: ['spoc', 'contact', 'contact person', 'poc'],
  invoiceNo: [
    'invoice no',
    'invoice no.',
    'invoice number',
    'invoice #',
    'inv no',
    'inv no.',
    'bill no',
    'bill number'
  ],
  invoiceDate: ['invoice date', 'inv date', 'bill date'],
  dueDate: ['due date', 'payment due date'],
  invoiceAmount: ['inv amount', 'invoice amount', 'amount', 'bill amount'],
  received: ['received', 'amount received', 'received amount', 'paid'],
  outstanding: ['outstanding', 'outstanding amount', 'balance', 'balance due']
};

const normalizeKey = (key) => String(key == null ? '' : key).trim().toLowerCase().replace(/\s+/g, ' ');

const findValue = (row, aliases) => {
  for (const [key, value] of Object.entries(row)) {
    if (aliases.includes(normalizeKey(key))) return value;
  }
  return undefined;
};

// MongoDB rejects field names that start with "$" or contain null bytes.
const sanitizeRecord = (row) => {
  const clean = {};
  Object.entries(row).forEach(([key, value]) => {
    const safeKey = String(key).replace(/\0/g, '').replace(/^\$/, '_');
    clean[safeKey] = value;
  });
  return clean;
};

/**
 * Maps generic spreadsheet rows into Invoice documents.
 * Returns metadata so the API can tell the user what was skipped and why.
 */
const mapInvoiceRows = (rows) => {
  const invoices = [];
  const seenInvoiceNos = new Set();
  const duplicates = [];
  const skippedRows = [];
  let negativeRows = 0;

  const headerKeys = new Set();
  rows.slice(0, 5).forEach((row) => {
    Object.keys(row).forEach((key) => headerKeys.add(normalizeKey(key)));
  });

  const hasInvoiceHeaders =
    COLUMN_ALIASES.invoiceNo.some((alias) => headerKeys.has(alias)) &&
    COLUMN_ALIASES.customer.some((alias) => headerKeys.has(alias));

  rows.forEach((row, index) => {
    const customer = String(findValue(row, COLUMN_ALIASES.customer) || '').trim();
    const invoiceNo = String(findValue(row, COLUMN_ALIASES.invoiceNo) || '').trim();
    const invoiceDate = parseDate(findValue(row, COLUMN_ALIASES.invoiceDate));
    const dueDate = parseDate(findValue(row, COLUMN_ALIASES.dueDate));

    if (!customer || !invoiceNo || !invoiceDate || !dueDate) {
      skippedRows.push(index + 2);
      return;
    }

    if (seenInvoiceNos.has(invoiceNo)) {
      duplicates.push(invoiceNo);
      return;
    }

    const rawInvoiceAmount = parseNumber(findValue(row, COLUMN_ALIASES.invoiceAmount));
    const rawReceived = parseNumber(findValue(row, COLUMN_ALIASES.received));
    const rawOutstanding = parseNumber(findValue(row, COLUMN_ALIASES.outstanding));

    if (rawInvoiceAmount < 0 || rawReceived < 0 || rawOutstanding < 0) {
      negativeRows += 1;
    }

    seenInvoiceNos.add(invoiceNo);
    invoices.push({
      customer,
      spoc: String(findValue(row, COLUMN_ALIASES.spoc) || '').trim() || 'N/A',
      invoiceNo,
      invoiceDate,
      dueDate,
      invoiceAmount: Math.max(0, rawInvoiceAmount),
      received: Math.max(0, rawReceived),
      outstanding: Math.max(0, rawOutstanding)
    });
  });

  return {
    invoices,
    hasInvoiceHeaders,
    skippedRows,
    duplicates,
    negativeRows
  };
};

/**
 * Controller to handle Excel uploads:
 * 1. Validates the file
 * 2. Parses the worksheet dynamically
 * 3. Stores rows in the dynamic ExcelRecord collection
 * 4. Syncs invoice-shaped rows into the Invoice collection
 * 5. Removes the temporary file
 */
const uploadExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Upload Failed: No Excel file was provided. Ensure the request key is named "file".'
    });
  }

  const filePath = req.file.path;
  const warnings = [];

  try {
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error('The uploaded file is empty (0 bytes).');
    }

    const jsonRecords = parseExcel(filePath);
    const {
      invoices,
      hasInvoiceHeaders,
      skippedRows,
      duplicates,
      negativeRows
    } = mapInvoiceRows(jsonRecords);

    // Insert the new generic records before removing the old ones. If the
    // cleanup fails we may leave extra rows behind, but we never lose data.
    const recordsToInsert = jsonRecords.map(sanitizeRecord);
    const insertedRecords = await ExcelRecord.insertMany(recordsToInsert);
    const keepRecordIds = insertedRecords.map((record) => record._id);

    try {
      await ExcelRecord.deleteMany({ _id: { $nin: keepRecordIds } });
    } catch (cleanupError) {
      warnings.push(`Old Excel records could not be removed: ${cleanupError.message}`);
    }

    let invoicesSynced = 0;

    if (hasInvoiceHeaders) {
      if (invoices.length > 0) {
        // Upsert by invoice number first, then remove invoices that are no
        // longer present in the uploaded sheet. This keeps old data intact if
        // the sync fails part-way through.
        const bulkOperations = invoices.map((invoice) => ({
          updateOne: {
            filter: { invoiceNo: invoice.invoiceNo },
            update: { $set: invoice },
            upsert: true
          }
        }));

        await Invoice.bulkWrite(bulkOperations, { ordered: false });
        await Invoice.deleteMany({
          invoiceNo: { $nin: invoices.map((invoice) => invoice.invoiceNo) }
        });
        invoicesSynced = invoices.length;
      } else {
        warnings.push('No valid invoice rows were found, so the invoice dashboard was not updated.');
      }

      if (skippedRows.length > 0) {
        warnings.push(
          `${skippedRows.length} row(s) were skipped because they were missing a customer, invoice number, invoice date, or due date.`
        );
      }

      if (duplicates.length > 0) {
        warnings.push(`${duplicates.length} duplicate invoice number(s) were ignored.`);
      }

      if (negativeRows > 0) {
        warnings.push(`${negativeRows} row(s) had negative amounts; negative values were saved as 0.`);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Excel uploaded successfully',
      recordsInserted: insertedRecords.length,
      invoicesSynced,
      skippedInvoiceRows: skippedRows.length,
      warnings
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Verification or processing failed.'
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error(`⚠️ Temporary file cleanup failed: ${cleanupError.message}`);
      }
    }
  }
};

/**
 * Controller to fetch all dynamic Excel records from the collection
 */
const getExcelRecords = async (req, res) => {
  try {
    const records = await ExcelRecord.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve Excel records: ' + error.message
    });
  }
};

module.exports = {
  uploadExcel,
  getExcelRecords
};
