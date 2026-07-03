import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

/**
 * Fetch all invoices sorted by invoiceDate descending
 */
export const getInvoices = async () => {
  const response = await apiClient.get('/invoices');
  return response.data;
};

/**
 * Upload an Excel file with the invoice template
 * @param {File} file 
 */
export const uploadInvoiceFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Fetch generic dynamic Excel records
 */
export const getExcelRecords = async () => {
  const response = await apiClient.get('/upload');
  return response.data;
};

/**
 * Fetch the payment report for a target customer
 * @param {string} customer 
 */
export const getPaymentReport = async (customer) => {
  const response = await apiClient.get(`/reports/payment/${encodeURIComponent(customer)}`);
  return response.data;
};

/**
 * Fetch the collection follow-up report for a target customer
 * @param {string} customer 
 */
export const getCollectionReport = async (customer) => {
  const response = await apiClient.get(`/reports/collection/${encodeURIComponent(customer)}`);
  return response.data;
};

export default apiClient;
