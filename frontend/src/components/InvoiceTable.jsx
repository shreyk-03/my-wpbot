import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  Chip,
  Box,
  Typography
} from '@mui/material';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getBucketChip = (bucketName) => {
  let color = 'default';
  let variant = 'outlined';
  let styles = {};

  switch (bucketName) {
    case 'Not Due':
      styles = { bgcolor: '#e2fbe8', color: '#0f7d23', fontWeight: 650, border: 'none' };
      break;
    case '0-15 Days':
      styles = { bgcolor: '#fef3c7', color: '#d97706', fontWeight: 650, border: 'none' };
      break;
    case '16-30 Days':
      styles = { bgcolor: '#ffedd5', color: '#ea580c', fontWeight: 650, border: 'none' };
      break;
    case '31-60 Days':
      styles = { bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 650, border: 'none' };
      break;
    case '61-90 Days':
      styles = { bgcolor: '#fca5a5', color: '#b91c1c', fontWeight: 650, border: 'none' };
      break;
    case '90+ Days':
      styles = { bgcolor: '#7f1d1d', color: '#ffffff', fontWeight: 600, border: 'none' };
      break;
    default:
      styles = { bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, border: 'none' };
  }

  return (
    <Chip
      label={bucketName || 'Unknown'}
      size="small"
      sx={{ ...styles, borderRadius: 2, fontSize: '0.75rem' }}
    />
  );
};

const InvoiceTable = ({ invoices = [] }) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('customer');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 1. Sort Handler
  const handleSortRequest = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // 2. Pagination Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 3. Sorting Utility
  const sortComparator = (a, b, orderByVal) => {
    let valA = a[orderByVal];
    let valB = b[orderByVal];

    // Handle date parsing
    if (orderByVal === 'invoiceDate' || orderByVal === 'dueDate') {
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    }

    // Handle string capitalization
    if (typeof valA === 'string') {
      valA = valA.trim().toLowerCase();
      valB = valB ? valB.trim().toLowerCase() : '';
    }

    if (valB < valA) {
      return order === 'asc' ? 1 : -1;
    }
    if (valB > valA) {
      return order === 'asc' ? -1 : 1;
    }
    return 0;
  };

  const sortedInvoices = [...invoices].sort((a, b) => sortComparator(a, b, orderBy));
  const paginatedInvoices = sortedInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3 }} elevation={0}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="sticky table" size="medium">
          <TableHead>
            <TableRow>
              {/* Customer */}
              <TableCell key="customer" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                <TableSortLabel
                  active={orderBy === 'customer'}
                  direction={orderBy === 'customer' ? order : 'asc'}
                  onClick={() => handleSortRequest('customer')}
                >
                  Customer
                </TableSortLabel>
              </TableCell>

              {/* SPOC */}
              <TableCell key="spoc" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                <TableSortLabel
                  active={orderBy === 'spoc'}
                  direction={orderBy === 'spoc' ? order : 'asc'}
                  onClick={() => handleSortRequest('spoc')}
                >
                  SPOC
                </TableSortLabel>
              </TableCell>

              {/* Invoice Number */}
              <TableCell key="invoiceNo" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                <TableSortLabel
                  active={orderBy === 'invoiceNo'}
                  direction={orderBy === 'invoiceNo' ? order : 'asc'}
                  onClick={() => handleSortRequest('invoiceNo')}
                >
                  Inv Number
                </TableSortLabel>
              </TableCell>

              {/* Invoice Date */}
              <TableCell key="invoiceDate" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                <TableSortLabel
                  active={orderBy === 'invoiceDate'}
                  direction={orderBy === 'invoiceDate' ? order : 'asc'}
                  onClick={() => handleSortRequest('invoiceDate')}
                >
                  Invoice Date
                </TableSortLabel>
              </TableCell>

              {/* Due Date */}
              <TableCell key="dueDate" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                <TableSortLabel
                  active={orderBy === 'dueDate'}
                  direction={orderBy === 'dueDate' ? order : 'asc'}
                  onClick={() => handleSortRequest('dueDate')}
                >
                  Due Date
                </TableSortLabel>
              </TableCell>

              {/* Invoice Amount */}
              <TableCell
                key="invoiceAmount"
                align="right"
                sx={{ fontWeight: 700, bgcolor: 'background.paper' }}
              >
                <TableSortLabel
                  active={orderBy === 'invoiceAmount'}
                  direction={orderBy === 'invoiceAmount' ? order : 'asc'}
                  onClick={() => handleSortRequest('invoiceAmount')}
                >
                  Inv Amount
                </TableSortLabel>
              </TableCell>

              {/* Received */}
              <TableCell
                key="received"
                align="right"
                sx={{ fontWeight: 700, bgcolor: 'background.paper' }}
              >
                <TableSortLabel
                  active={orderBy === 'received'}
                  direction={orderBy === 'received' ? order : 'asc'}
                  onClick={() => handleSortRequest('received')}
                >
                  Received
                </TableSortLabel>
              </TableCell>

              {/* Outstanding */}
              <TableCell
                key="outstanding"
                align="right"
                sx={{ fontWeight: 700, bgcolor: 'background.paper' }}
              >
                <TableSortLabel
                  active={orderBy === 'outstanding'}
                  direction={orderBy === 'outstanding' ? order : 'asc'}
                  onClick={() => handleSortRequest('outstanding')}
                >
                  Outstanding
                </TableSortLabel>
              </TableCell>

              {/* Ageing Bucket */}
              <TableCell key="ageingBucket" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                <TableSortLabel
                  active={orderBy === 'ageingBucket'}
                  direction={orderBy === 'ageingBucket' ? order : 'asc'}
                  onClick={() => handleSortRequest('ageingBucket')}
                >
                  Ageing Bucket
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInvoices.length > 0 ? (
              paginatedInvoices.map((row) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={row._id}>
                  <TableCell sx={{ fontWeight: 600 }}>{row.customer}</TableCell>
                  <TableCell>{row.spoc || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                      {row.invoiceNo}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(row.invoiceDate)}</TableCell>
                  <TableCell>{formatDate(row.dueDate)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {formatCurrency(row.invoiceAmount)}
                  </TableCell>
                  <TableCell align="right" style={{ color: '#0f7d23' }} sx={{ fontWeight: 500 }}>
                    {formatCurrency(row.received)}
                  </TableCell>
                  <TableCell align="right" style={{ color: '#c2410c' }} sx={{ fontWeight: 700 }}>
                    {formatCurrency(row.outstanding)}
                  </TableCell>
                  <TableCell>{getBucketChip(row.ageingBucket)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No matching invoices found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={invoices.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default InvoiceTable;
