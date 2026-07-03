import React from 'react';
import { Backdrop, CircularProgress, Box, Typography } from '@mui/material';

const Loader = ({ open, message }) => {
  return (
    <Backdrop
      sx={{ color: '#ffffff', zIndex: (theme) => theme.zIndex.drawer + 999 }}
      open={open}
    >
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2}>
        <CircularProgress color="inherit" size={50} />
        {message && (
          <Typography variant="body1" sx={{ fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {message}
          </Typography>
        )}
      </Box>
    </Backdrop>
  );
};

export default Loader;
