const xlsx = require('xlsx');
const fs = require('fs');

/**
 * Parses an Excel file dynamically without hardcoding column names.
 * Converts the first sheet into a JSON array of objects.
 * 
 * @param {string} filePath - Absolute path to the uploaded excel file
 * @returns {Array<Object>} Array of raw dynamic row objects
 */
const parseExcel = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found on server.');
  }

  let workbook;
  try {
    // Read the Excel workbook
    workbook = xlsx.readFile(filePath, { cellDates: true, cellNF: false, cellText: false });
  } catch (error) {
    throw new Error(`Invalid or corrupted Excel file: ${error.message}`);
  }

  // Ensure workbook has sheets
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Excel file contains no worksheets.');
  }

  // Get the first worksheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert worksheet to JSON (first row treated as headers automatically by sheet_to_json)
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: null });

  // Validate file contents
  if (!jsonData || jsonData.length === 0) {
    throw new Error('Excel file is empty or contains no records.');
  }

  // Clean empty keys & rows (verify the row actually has some content)
  const cleanedData = jsonData.filter(row => {
    const keys = Object.keys(row);
    // Include row only if at least one value is non-null/non-empty
    return keys.some(key => row[key] !== null && row[key] !== undefined && String(row[key]).trim() !== '');
  });

  if (cleanedData.length === 0) {
    throw new Error('Excel sheet contains only empty rows.');
  }

  return cleanedData;
};

module.exports = {
  parseExcel
};
