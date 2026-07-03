import React from 'react';
import { Snackbar as MuiSnackbar, Alert } from '@mui/material';

const Snackbar = ({ open, onClose, message, severity = 'success' }) => {
  return (
    <MuiSnackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
        {message}
      </Alert>
    </MuiSnackbar>
  );
};

export default Snackbar;
