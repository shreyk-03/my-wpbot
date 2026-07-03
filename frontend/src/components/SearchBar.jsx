import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ searchValue, onSearchChange }) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      size="medium"
      placeholder="Search by customer name or invoice number..."
      value={searchValue}
      onChange={(e) => onSearchChange(e.target.value)}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
        }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'text.secondary' }} />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default SearchBar;
