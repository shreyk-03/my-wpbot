import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';

import { getInvoices, getApiErrorMessage } from '../services/api';
import StatCards from '../components/StatCards';
import SearchBar from '../components/SearchBar';
import BucketTabs from '../components/BucketTabs';
import InvoiceTable from '../components/InvoiceTable';
import UploadDialog from '../components/UploadDialog';
import Loader from '../components/Loader';
import Snackbar from '../components/Snackbar';

const Dashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Dialog, Toast & Filter states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBucketTab, setSelectedBucketTab] = useState('All');
  const [lastUploadTime, setLastUploadTime] = useState(null);

  // 1. Fetch Invoices Logic
  const fetchDashboardData = async (showBackgroundLoader = false) => {
    if (!showBackgroundLoader) setLoading(true);
    setErrorMsg('');
    
    try {
      const response = await getInvoices();
      if (response && response.success) {
        const data = response.data || [];
        setInvoices(data);

        // Find the latest invoice creation time to display as Last Upload
        if (data.length > 0) {
          const timestamps = data
            .map(inv => (inv.createdAt ? new Date(inv.createdAt).getTime() : 0))
            .filter(t => t > 0);
            
          if (timestamps.length > 0) {
            setLastUploadTime(new Date(Math.max(...timestamps)));
          } else {
            setLastUploadTime(new Date());
          }
        } else {
          setLastUploadTime(null);
        }
      } else {
        setErrorMsg((response && response.message) || 'Failed to load invoices.');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setErrorMsg(getApiErrorMessage(err, 'Failed to load invoices. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 2. Upload Callback Handlers
  const handleUploadSuccess = (result) => {
    const recordsImported =
      typeof result === 'number' ? result : (result && result.recordsInserted) || 0;
    const warnings = (result && result.warnings) || [];

    setSnackbarMsg(
      warnings.length > 0
        ? `✓ Imported ${recordsImported} rows. ${warnings.join(' ')}`
        : `✓ Excel Uploaded Successfully: Imported ${recordsImported} invoices.`
    );
    setSnackbarSeverity(warnings.length > 0 ? 'warning' : 'success');
    setSnackbarOpen(true);
    fetchDashboardData();
  };

  const handleRefreshClick = () => {
    fetchDashboardData(true);
    setSnackbarMsg('Reloading data from database...');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };

  // 3. Client Side Searching & Tab Filtering
  const handleSearchChange = (val) => {
    setSearchTerm(val);
  };

  const handleTabChange = (val) => {
    setSelectedBucketTab(val);
  };

  // Filter invoices pipeline
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredInvoices = invoices.filter(inv => {
    // A. Apply Search Filter (Customer or Invoice Number)
    const customer = String(inv.customer || '').toLowerCase();
    const invoiceNo = String(inv.invoiceNo || '').toLowerCase();
    const matchesSearch =
      normalizedSearchTerm === '' ||
      customer.includes(normalizedSearchTerm) ||
      invoiceNo.includes(normalizedSearchTerm);

    // B. Apply Bucket Tab Filter
    const matchesTab = selectedBucketTab === 'All' || inv.ageingBucket === selectedBucketTab;

    return matchesSearch && matchesTab;
  });

  // Calculate high-level summary cards stats (always based on total database invoices list)
  const activeInvoicesCount = invoices.filter(inv => (inv.outstanding || 0) > 0).length;
  const totalOutstandingSum = invoices.reduce((sum, inv) => sum + (inv.outstanding || 0), 0);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header Ribbon / Navigation Bar */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={850} color="primary.main">
              Accounts Receivable Board
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Collections Agent Pipeline & Invoices Overview Portal
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <IconButton onClick={handleRefreshClick} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CloudUploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
            >
              Upload AR Sheet
            </Button>
          </Box>
        </Box>

        {/* Global Error Banner */}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }} action={
            <Button color="inherit" size="small" onClick={() => fetchDashboardData()}>
              Retry
            </Button>
          }>
            {errorMsg}
          </Alert>
        )}

        {/* Top Summary StatCards */}
        <StatCards
          count={activeInvoicesCount}
          totalOutstanding={totalOutstandingSum}
          lastImportTime={lastUploadTime}
        />

        {/* Invoices Workspace Panel */}
        <Grid container spacing={3} mt={1}>
          <Grid item xs={12}>
            <Card elevation={0}>
              <CardContent sx={{ p: 3 }}>
                {/* Search Bar Row */}
                <Box mb={3}>
                  <SearchBar searchValue={searchTerm} onSearchChange={handleSearchChange} />
                </Box>

                {/* Filter Tabs Row */}
                <BucketTabs
                  activeTab={selectedBucketTab}
                  onTabChange={handleTabChange}
                  invoices={invoices}
                />

                {/* Main Data Table */}
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <p>Loading table records...</p>
                  </Box>
                ) : invoices.length === 0 ? (
                  errorMsg ? (
                    /* Error state: do not pretend the database is simply empty */
                    <Box textAlign="center" py={8} px={2} border="1px dashed" borderColor="divider" borderRadius={2} bgcolor="#fafafa">
                      <Typography variant="h6" fontWeight={750} mb={1}>
                        Unable to load invoices
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={3} maxWidth={420} mx="auto">
                        The dashboard could not reach the API. Check the error above, then retry.
                      </Typography>
                      <Button variant="outlined" onClick={() => fetchDashboardData()}>
                        Retry
                      </Button>
                    </Box>
                  ) : (
                    /* Empty state layout */
                    <Box textAlign="center" py={8} px={2} border="1px dashed" borderColor="divider" borderRadius={2} bgcolor="#fafafa">
                      <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" fontWeight={750} mb={1}>
                        No invoices uploaded yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={3} maxWidth={400} mx="auto">
                        Get started by importing your AR sheet template. Once processed, you will see lists, breakdowns, and past due details in real-time.
                      </Typography>
                      <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setUploadDialogOpen(true)}>
                        Upload First Sheet
                      </Button>
                    </Box>
                  )
                ) : (
                  <InvoiceTable invoices={filteredInvoices} />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Backdrop Loaders and Dialog Modals */}
        <Loader open={loading && invoices.length === 0} message="Syncing records, please wait..." />
        
        <UploadDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />

        <Snackbar
          open={snackbarOpen}
          message={snackbarMsg}
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
        />
      </Container>
    </Box>
  );
};

export default Dashboard;
