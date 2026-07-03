import React from 'react';
import { Tabs, Tab, Box, Typography, Paper } from '@mui/material';

const formatCurrencyTabValue = (amount) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const BucketTabs = ({ activeTab, onTabChange, invoices }) => {
  // 1. Define target buckets
  const tabsList = [
    { id: 'All', label: 'All Invoices' },
    { id: 'Not Due', label: 'Not Due' },
    { id: '0-15 Days', label: '0-15 Days' },
    { id: '16-30 Days', label: '16-30 Days' },
    { id: '31-60 Days', label: '31-60 Days' },
    { id: '61-90 Days', label: '61-90 Days' },
    { id: '90+ Days', label: '90+ Days' },
  ];

  // 2. Aggregate counts and values dynamically
  const metrics = tabsList.reduce((acc, tab) => {
    acc[tab.id] = { count: 0, sum: 0 };
    return acc;
  }, {});

  invoices.forEach(inv => {
    const outstanding = inv.outstanding || 0;
    const bucket = inv.ageingBucket || 'Unknown';

    // Accumulate to 'All'
    metrics['All'].count += 1;
    metrics['All'].sum += outstanding;

    // Accumulate to specific bucket if mapped
    if (metrics[bucket]) {
      metrics[bucket].count += 1;
      metrics[bucket].sum += outstanding;
    }
  });

  return (
    <Paper sx={{ mb: 3 }} elevation={0}>
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => onTabChange(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        textColor="primary"
        indicatorColor="primary"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          borderRadius: 2,
          '& .MuiTabs-flexContainer': {
            gap: 1
          }
        }}
      >
        {tabsList.map((tab) => {
          const { count, sum } = metrics[tab.id] || { count: 0, sum: 0 };
          return (
            <Tab
              key={tab.id}
              value={tab.id}
              sx={{
                py: 2,
                minWidth: 120,
                alignItems: 'center'
              }}
              label={
                <Box textAlign="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="inherit">
                    {tab.label}
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.5,
                      bgcolor: activeTab === tab.id ? 'primary.light' : 'action.hover',
                      color: activeTab === tab.id ? 'primary.contrastText' : 'text.secondary',
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: '0.725rem',
                      fontWeight: 600
                    }}
                  >
                    <span>{count}</span>
                    <span>•</span>
                    <span>{formatCurrencyTabValue(sum)}</span>
                  </Box>
                </Box>
              }
            />
          );
        })}
      </Tabs>
    </Paper>
  );
};

export default BucketTabs;
