const fs = require('fs');
const path = require('path');
const ExcelRecord = require('../models/ExcelRecord');
const Invoice = require('../models/Invoice');
const { parseExcel } = require('../utils/excelParser');
const { parseDate, parseNumber } = require('../services/excelService');

/**
 * Controller to handle generic Excel uploads:
 * 1. Validates inputs
 * 2. Parses worksheet dynamically into JSON
 * 3. Inserts all rows into a dynamic ExcelRecord collection
 * 4. Syncs to Invoice collection if typical invoice columns match
 * 5. Deletes the temporary file
 * 6. Handles errors & returns standard response
 */
const uploadExcel = async (req, res) => {
  // 1. Verify file was received
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Upload Failed: No Excel file was provided. Ensure the request key is named "file".'
    });
  }

  const filePath = req.file.path;

  try {
    // Check if the uploaded file is empty physically
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error('The uploaded file is empty (0 bytes).');
    }

    // 2. Parse Excel Worksheet data dynamically (first row treated as headers)
    const jsonRecords = parseExcel(filePath);

    // 3. Clear previous generic Excel records
    await ExcelRecord.deleteMany({});

    // 4. Store each row dynamically in MongoDB (strict: false)
    const recordsInserted = await ExcelRecord.insertMany(jsonRecords);

    // 5. Check if the columns match the Invoice template, and if so, sync to Invoice collection
    // This allows the existing Invoicing/Reporting dashboard features to continue working seamlessly.
    try {
      const invoiceDataToSync = [];
      let isInvoiceSheet = true;

      for (let i = 0; i < jsonRecords.length; i++) {
        const row = jsonRecords[i];
        
        // Normalize keys: trim and map aliases
        const rowData = {};
        Object.keys(row).forEach(key => {
          rowData[key.trim()] = row[key];
        });

        // Resolve column mappings
        const customer = rowData['Customer'] || rowData['customer'] || '';
        const spoc = rowData['SPOC'] || rowData['spoc'] || rowData['Spoc'] || '';
        const invoiceNoVal = rowData['Invoice No'] || rowData['invoice no'] || rowData['Invoice No.'] || rowData['Invoice Number'] || '';
        const invoiceDateVal = rowData['Invoice Date'] || rowData['invoice date'] || null;
        const dueDateVal = rowData['Due Date'] || rowData['due date'] || null;
        const invoiceAmountVal = rowData['Inv Amount'] || rowData['inv amount'] || rowData['Invoice Amount'] || rowData['Amount'] || rowData['amount'] || 0;
        const receivedVal = rowData['Received'] || rowData['received'] || 0;
        const outstandingVal = rowData['Outstanding'] || rowData['outstanding'] || 0;

        const invoiceNo = String(invoiceNoVal).trim();
        const invoiceDate = parseDate(invoiceDateVal);
        const dueDate = parseDate(dueDateVal);

        // Core invoice validation check
        if (!invoiceNo || !invoiceDate || !dueDate || !customer) {
          isInvoiceSheet = false;
          break;
        }

        invoiceDataToSync.push({
          customer: String(customer).trim(),
          spoc: String(spoc).trim(),
          invoiceNo,
          invoiceDate,
          dueDate,
          invoiceAmount: parseNumber(invoiceAmountVal),
          received: parseNumber(receivedVal),
          outstanding: parseNumber(outstandingVal)
        });
      }

      // If it has all the invoice properties, sync the Invoices collection
      if (isInvoiceSheet && invoiceDataToSync.length > 0) {
        console.log(`📡 Auto-syncing ${invoiceDataToSync.length} records to the Invoices collection...`);
        await Invoice.deleteMany({});
        await Invoice.insertMany(invoiceDataToSync);
      }
    } catch (syncErr) {
      console.warn(`⚠️ Failed to sync to Invoices collection (optional): ${syncErr.message}`);
      // Don't fail the request since this is a generic uploader and the main ExcelRecord insert worked.
    }

    // Clean up temporary excel file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 6. Return success response
    return res.status(200).json({
      success: true,
      message: 'Excel uploaded successfully',
      recordsInserted: recordsInserted.length
    });

  } catch (error) {
    // Ensure the temp file is deleted even if error happens
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`⚠️ Temporary file cleanup failed during error flow: ${err.message}`);
      }
    }

    // Return specific validation/parsing messages
    return res.status(400).json({
      success: false,
      message: error.message || 'Verification or processing failed.'
    });
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
