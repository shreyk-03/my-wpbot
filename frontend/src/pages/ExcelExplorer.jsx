import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import RefreshIcon from '@mui/icons-material/Refresh';
import TableChartIcon from '@mui/icons-material/TableChart';

import { uploadInvoiceFile, getExcelRecords } from '../services/api';

const ExcelExplorer = () => {
  // Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Table Data States
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  
  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 1. Fetch data on mount
  const fetchRecords = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await getExcelRecords();
      if (response && response.success) {
        setRecords(response.data || []);
      } else {
        setFetchError(response.message || 'Failed to download spreadsheet records.');
      }
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Server connection error. Is backend online?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // 2. File Input/Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setUploadError('');
    setUploadSuccess('');
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setUploadError('Invalid file type. Please select a Microsoft Excel file (.xlsx or .xls) only.');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setUploadError('');
    setUploadSuccess('');
  };

  // 3. Upload Submission Handler
  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const response = await uploadInvoiceFile(selectedFile);
      if (response && response.success) {
        setUploadSuccess(`✓ Success! uploaded "${selectedFile.name}". ${response.recordsInserted || 0} records inserted dynamically.`);
        setSelectedFile(null);
        // Refresh Table Data
        await fetchRecords();
      } else {
        setUploadError(response.message || 'File upload failed.');
      }
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.message || 'Server error occurred during uploading.');
    } finally {
      setUploading(false);
    }
  };

  // 4. Searching Filter Mapping
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const filteredRecords = records.filter(row => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    // Check if the search term matches any property value in this row (ignoring mongoose internals)
    return Object.keys(row).some(key => {
      if (['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) return false;
      const value = row[key];
      return value !== null && value !== undefined && String(value).toLowerCase().includes(term);
    });
  });

  // Calculate dynamic table headers based on columns present in data (ignoring mongoose fields)
  // Accumulate unique keys from all rows (if keys differ)
  const getDynamicHeaders = () => {
    if (records.length === 0) return [];
    
    const excludedKeys = ['_id', '__v', 'createdAt', 'updatedAt'];
    const keysSet = new Set();
    
    // Scan all rows to support spreadsheets with slightly variant columns, but prioritize first few
    records.slice(0, 10).forEach(row => {
      Object.keys(row).forEach(key => {
        if (!excludedKeys.includes(key)) {
          keysSet.add(key);
        }
      });
    });
    
    return Array.from(keysSet);
  };

  const headers = getDynamicHeaders();

  // Pagination Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated dataset
  const paginatedRecords = filteredRecords.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Title Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={850} color="primary.main">
            Generic Excel Explorer
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Upload any Excel spreadsheet. Data columns and records are mapped and visualized dynamically in real-time.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={fetchRecords}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Main Grid Workspace */}
      <Grid container spacing={4}>
        {/* Upload card */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={750} gutterBottom display="flex" alignItems="center" gap={1}>
                <CloudUploadIcon color="primary" /> Upload New Spreadsheet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Drop an Excel file below to insert all rows dynamically into MongoDB.
              </Typography>

              {/* Drag/Drop Box */}
              <Box
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: dragActive ? 'primary.main' : 'divider',
                  borderRadius: 3,
                  bgcolor: dragActive ? 'action.hover' : 'background.default',
                  p: 4,
                  textAlign: 'center',
                  cursor: uploading ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  mb: 3,
                  '&:hover': {
                    borderColor: uploading ? 'divider' : 'primary.main',
                    bgcolor: uploading ? 'background.default' : 'action.hover',
                  }
                }}
              >
                <input
                  type="file"
                  id="excel-file-selector"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                
                <label htmlFor="excel-file-selector" style={{ width: '100%', cursor: uploading ? 'default' : 'pointer' }}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    {selectedFile ? (
                      <>
                        <FilePresentIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1.5 }} />
                        <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ width: '200px' }}>
                          {selectedFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </Typography>
                      </>
                    ) : (
                      <>
                        <CloudUploadIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1.5 }} />
                        <Typography variant="subtitle2" fontWeight={650}>
                          Drag & drop or Click to browse
                        </Typography>
                        <Typography variant="caption" color="text.secondary" mt={0.5}>
                          Supports .xlsx and .xls files
                        </Typography>
                      </>
                    )}
                  </Box>
                </label>
              </Box>

              {/* Status messages */}
              {uploadError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {uploadError}
                </Alert>
              )}
              {uploadSuccess && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  {uploadSuccess}
                </Alert>
              )}

              {/* Upload Action buttons */}
              <Box display="flex" gap={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  onClick={clearSelectedFile}
                  disabled={!selectedFile || uploading}
                  startIcon={<DeleteSweepIcon />}
                >
                  Clear
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleUploadSubmit}
                  disabled={!selectedFile || uploading}
                  startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                >
                  {uploading ? 'Processing...' : 'Upload File'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Table viewer */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
                <Typography variant="h6" fontWeight={750} display="flex" alignItems="center" gap={1}>
                  <TableChartIcon color="primary" /> Dynamic Database Board
                </Typography>
                
                {/* Search field */}
                <TextField
                  placeholder="Search across all columns..."
                  size="small"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  sx={{ width: { xs: '100%', sm: 300 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Loader during data fetching */}
              {loading ? (
                <Box display="flex" flexDirection="column" gap={2} py={8} alignItems="center" justifyContent="center">
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary">
                    Retrieving spreadsheet collections...
                  </Typography>
                </Box>
              ) : fetchError ? (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {fetchError}
                </Alert>
              ) : records.length === 0 ? (
                /* Empty state */
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  border="1px dashed"
                  borderColor="divider"
                  borderRadius={3}
                  bgcolor="action.hover"
                  py={8}
                  textAlign="center"
                >
                  <CloudUploadIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" fontWeight={750} mb={1}>
                    No records found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" maxWidth={400} px={2}>
                    The database has no Excel records uploaded. Drag and drop your spreadsheet on the left card to populate this table dynamically.
                  </Typography>
                </Box>
              ) : (
                /* Dynamic database table element */
                <>
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto', maxHeight: 440 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {headers.map((header) => (
                            <TableCell 
                              key={header} 
                              sx={{ 
                                bgcolor: 'grey.50', 
                                fontWeight: 750, 
                                color: 'text.primary',
                                borderBottom: '2px solid',
                                borderBottomColor: 'divider'
                              }}
                            >
                              {header}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedRecords.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={headers.length} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                              No matching records match search query.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedRecords.map((row, index) => (
                            <TableRow key={row._id || index} hover>
                              {headers.map((header) => {
                                let val = row[header];
                                if (val instanceof Date || (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))) {
                                  val = new Date(val).toLocaleDateString();
                                }
                                return (
                                  <TableCell key={header}>
                                    {val === null || val === undefined ? '-' : String(val)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Pagination widget */}
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredRecords.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ExcelExplorer;
