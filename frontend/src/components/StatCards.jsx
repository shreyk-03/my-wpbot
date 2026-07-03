import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const StatCards = ({ count, totalOutstanding, lastImportTime }) => {
  const stats = [
    {
      title: 'Total Outstanding',
      value: formatCurrency(totalOutstanding || 0),
      icon: <AccountBalanceWalletIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      bgColor: 'primary.light',
      subtitle: 'Amount remaining to collect'
    },
    {
      title: 'Active Invoices',
      value: count || 0,
      icon: <ReceiptLongIcon sx={{ fontSize: 32, color: 'secondary.main' }} />,
      bgColor: 'secondary.light',
      subtitle: 'Total number of unpaid bills'
    },
    {
      title: 'Last Upload Time',
      value: lastImportTime ? new Date(lastImportTime).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) : 'No Sheet Uploaded',
      icon: <CloudUploadIcon sx={{ fontSize: 32, color: 'warning.main' }} />,
      bgColor: 'warning.light',
      subtitle: 'Spreadsheet last synched'
    }
  ];

  return (
    <Grid container spacing={3} mb={4}>
      {stats.map((stat, index) => (
        <Grid item xs={12} md={4} key={index}>
          <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            {/* Design accents for a sleek vibe */}
            <Box
              sx={{
                position: 'absolute',
                top: -15,
                right: -15,
                width: 70,
                height: 70,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                zIndex: 0
              }}
            />
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                  {stat.title}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'action.hover'
                  }}
                >
                  {stat.icon}
                </Box>
              </Box>
              <Typography variant="h4" mb={0.5} sx={{ fontWeight: 700 }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.subtitle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatCards;
