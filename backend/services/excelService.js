const xlsx = require('xlsx');
const fs = require('fs');

/**
 * Parses safe numeric values from Excel cells
 */
const parseNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.-]/g, ''); // Remove commas/currency symbols
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

/**
 * Parses and normalizes dates from Excel (supporting serialized numbers & formatted strings)
 */
const parseDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  
  if (typeof val === 'number') {
    // Excel serial date number conversion (since Dec 30, 1899)
    const date = new Date((val - 25569) * 24 * 60 * 60 * 1000);
    // Compensate for daylight savings time shifts if necessary, strip timestamp for clean invoice dates
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }
  
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return null;
    
    // Try native parsing
    let parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      parsedDate.setUTCHours(0, 0, 0, 0);
      return parsedDate;
    }
    
    // Process DD/MM/YYYY or DD-MM-YYYY format
    const parts = trimmed.split(/[-/]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // months are 0-indexed in JS
      const year = parseInt(parts[2], 10);
      
      // Ensure valid numbers
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        // Handle 2-digit years if present
        const fullYear = year < 100 ? (year + (year < 50 ? 2000 : 1900)) : year;
        parsedDate = new Date(Date.UTC(fullYear, month, day));
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
  }
  
  return null;
};

/**
 * Reads and parses an uploaded Excel file
 * @param {string} filePath - Absolute path to the Excel file
 * @returns {Array<Object>} Cleaned invoice objects
 */
const parseExcelFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found at specified path');
  }

  let workbook;
  try {
    workbook = xlsx.readFile(filePath, { cellDates: true, cellNF: false, cellText: false });
  } catch (err) {
    throw new Error(`Corrupted or invalid Excel file. Technical details: ${err.message}`);
  }

  // Verify sheet count
  if (workbook.SheetNames.length === 0) {
    throw new Error('Excel workbook contains no sheets');
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert sheet to JSON array
  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  
  if (!rawRows || rawRows.length === 0) {
    throw new Error('Excel sheet is empty or contains no records');
  }

  const processedInvoices = [];
  
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    // Normalize keys: trim and map aliases
    const rowData = {};
    Object.keys(row).forEach(key => {
      rowData[key.trim()] = row[key];
    });

    // Check if the row contains values or is completely empty
    const values = Object.values(rowData).filter(v => v !== '');
    if (values.length === 0) {
      continue; // Skip empty rows
    }

    // Resolve column mappings
    const customer = rowData['Customer'] || rowData['customer'] || '';
    const spoc = rowData['SPOC'] || rowData['spoc'] || rowData['Spoc'] || '';
    const invoiceNoVal = rowData['Invoice No'] || rowData['invoice no'] || rowData['Invoice No.'] || rowData['Invoice Number'] || '';
    const invoiceDateVal = rowData['Invoice Date'] || rowData['invoice date'] || null;
    const dueDateVal = rowData['Due Date'] || rowData['due date'] || null;
    const invoiceAmountVal = rowData['Inv Amount'] || rowData['inv amount'] || rowData['Invoice Amount'] || rowData['Amount'] || rowData['amount'] || 0;
    const receivedVal = rowData['Received'] || rowData['received'] || 0;
    const outstandingVal = rowData['Outstanding'] || rowData['outstanding'] || 0;

    // Build invoice record
    const invoiceNo = String(invoiceNoVal).trim();
    
    // Core validation: Invoice # must exist
    if (!invoiceNo) {
      throw new Error(`Row ${i + 2}: Missing Invoice Number ('Invoice No')`);
    }

    const invoiceDate = parseDate(invoiceDateVal);
    if (!invoiceDate) {
      throw new Error(`Row ${i + 2} (Inv: "${invoiceNo}"): Valid Invoice Date ('Invoice Date') is required`);
    }

    const dueDate = parseDate(dueDateVal);
    if (!dueDate) {
      throw new Error(`Row ${i + 2} (Inv: "${invoiceNo}"): Valid Due Date ('Due Date') is required`);
    }

    const invoiceAmount = parseNumber(invoiceAmountVal);
    const received = parseNumber(receivedVal);
    const outstanding = parseNumber(outstandingVal);

    // Basic consistency verification
    if (invoiceAmount < 0) {
      throw new Error(`Row ${i + 2} (Inv: "${invoiceNo}"): Inv Amount cannot be negative`);
    }

    processedInvoices.push({
      customer: String(customer).trim(),
      spoc: String(spoc).trim(),
      invoiceNo,
      invoiceDate,
      dueDate,
      invoiceAmount,
      received,
      outstanding
    });
  }

  if (processedInvoices.length === 0) {
    throw new Error('No valid invoice records found in Excel sheet');
  }

  return processedInvoices;
};

module.exports = {
  parseExcelFile,
  parseDate,
  parseNumber
};
