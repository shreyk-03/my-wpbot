import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Tabs, 
  Tab, 
  Box, 
  Container 
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TableChartIcon from '@mui/icons-material/TableChart';
import theme from './theme';
import Dashboard from './pages/Dashboard';
import ExcelExplorer from './pages/ExcelExplorer';

function App() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Modern App Header */}
        <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', color: 'text.primary' }}>
          <Container maxWidth="xl">
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>
              {/* Logo / Brand Name */}
              <Box display="flex" alignItems="center" gap={1}>
                <TableChartIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h6" fontWeight={850} color="text.primary" letterSpacing="-0.5px">
                  WhatsApp Collections <Typography component="span" variant="h6" fontWeight={800} color="primary.main">Agent</Typography>
                </Typography>
              </Box>

              {/* Navigation Tabs */}
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                textColor="primary" 
                indicatorColor="primary"
                sx={{
                  minHeight: 48,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    minWidth: 120,
                    px: 3,
                    borderRadius: 2,
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'action.hover',
                    }
                  }
                }}
              >
                <Tab label="AR Dashboard" icon={<DashboardIcon />} iconPosition="start" />
                <Tab label="Excel Explorer" icon={<TableChartIcon />} iconPosition="start" />
              </Tabs>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Dynamic View Injection */}
        <Box sx={{ mt: 1 }}>
          {activeTab === 0 && <Dashboard />}
          {activeTab === 1 && <ExcelExplorer />}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
