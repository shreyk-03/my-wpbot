import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { uploadInvoiceFile } from '../services/api';

const UploadDialog = ({ open, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. File Drag/Drop Events Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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

  // 2. Validation Checks
  const validateAndSetFile = (selectedFile) => {
    setErrorMessage('');
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    
    if (ext !== 'xlsx') {
      setErrorMessage('Unsupported file format. Please upload an Excel sheet (.xlsx) only.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
  };

  // 3. Upload Submission API
  const handleUploadSubmit = async () => {
    if (!file) return;

    setUploading(true);
    setErrorMessage('');

    try {
      const response = await uploadInvoiceFile(file);
      
      if (response && response.success) {
        onUploadSuccess(response.recordsImported || 0);
        handleCloseClear();
      } else {
        setErrorMessage(response.message || 'File upload failed. Please verify format.');
      }
    } catch (err) {
      console.error('File Upload Error:', err);
      // Extract nested message parameter if available
      const message = err.response?.data?.message || 'Server error occurred during processing.';
      setErrorMessage(message);
    } finally {
      setUploading(false);
    }
  };

  // 4. Modal Cleanup
  const handleCloseClear = () => {
    setFile(null);
    setErrorMessage('');
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={uploading ? null : handleCloseClear} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Upload Accounts Receivable Excel
        </Typography>
        {!uploading && (
          <IconButton onClick={handleCloseClear}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 4 }}>
        {/* Drag and Drop Container Wrapper */}
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
            p: 5,
            textAlign: 'center',
            cursor: uploading ? 'default' : 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
            '&:hover': {
              borderColor: uploading ? 'divider' : 'primary.main',
              bgcolor: uploading ? 'background.default' : 'action.hover',
            }
          }}
        >
          <input
            type="file"
            id="xlsx-file-upload-input"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={uploading}
          />
          
          <label htmlFor="xlsx-file-upload-input" style={{ width: '100%', height: '100%', cursor: uploading ? 'default' : 'pointer' }}>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
              {file ? (
                <>
                  <InsertDriveFileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: '80%' }}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" mt={0.5}>
                    {(file.size / 1024).toFixed(1)} KB
                  </Typography>
                </>
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="subtitle1" fontWeight={650} color="text.primary">
                    Drag and drop your spreadsheet here or click to browse
                  </Typography>
                  <Typography variant="caption" color="text.secondary" mt={0.5}>
                    Accepts only Microsoft Excel XML formats (.xlsx)
                  </Typography>
                </>
              )}
            </Box>
          </label>
        </Box>

        {/* Display progress loading bar */}
        {uploading && (
          <Box sx={{ width: '100%', mt: 3 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1}>
              Parsing spreadsheet contents and syncing database state...
            </Typography>
          </Box>
        )}

        {/* Display error label */}
        {errorMessage && (
          <Typography variant="body2" color="error.main" textAlign="center" mt={3} fontWeight={600}>
            ⚠️ {errorMessage}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleCloseClear} variant="text" disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUploadSubmit}
          variant="contained"
          disabled={!file || uploading}
          startIcon={<CloudUploadIcon />}
        >
          {uploading ? 'Uploading...' : 'Confirm Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
