import axios from 'axios';

const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Render's free tier can take 30-60s to wake up after spinning down.
  timeout: 45000
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries idempotent GET requests once when the backend is cold-starting or
 * briefly unreachable. Never retries actual HTTP errors (4xx/5xx) because those
 * already carry a useful message.
 */
const getWithRetry = async (url, config = {}, retries = 1) => {
  try {
    return await apiClient.get(url, config);
  } catch (error) {
    const isNetworkError = !error.response;
    const isTimeout = error.code === 'ECONNABORTED';

    if (retries > 0 && (isNetworkError || isTimeout)) {
      await delay(2500);
      return getWithRetry(url, config, retries - 1);
    }

    throw error;
  }
};

/**
 * Converts an Axios error into a message that is useful to a human.
 */
export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback;

  if (error.code === 'ECONNABORTED') {
    return 'The server took too long to respond. It may be waking up from sleep — please retry.';
  }

  if (!error.response) {
    return 'Cannot reach the API server. Check that the backend is running and VITE_API_URL is correct.';
  }

  return error.response.data?.message || fallback;
};

/**
 * Fetch all invoices sorted by invoiceDate descending
 */
export const getInvoices = async () => {
  const response = await getWithRetry('/invoices');
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
      'Content-Type': 'multipart/form-data'
    },
    timeout: 120000
  });
  return response.data;
};

/**
 * Fetch generic dynamic Excel records
 */
export const getExcelRecords = async () => {
  const response = await getWithRetry('/upload');
  return response.data;
};

/**
 * Fetch the payment report for a target customer
 * @param {string} customer
 */
export const getPaymentReport = async (customer) => {
  const response = await getWithRetry(`/reports/payment/${encodeURIComponent(customer)}`);
  return response.data;
};

/**
 * Fetch the collection follow-up report for a target customer
 * @param {string} customer
 */
export const getCollectionReport = async (customer) => {
  const response = await getWithRetry(`/reports/collection/${encodeURIComponent(customer)}`);
  return response.data;
};

export default apiClient;
