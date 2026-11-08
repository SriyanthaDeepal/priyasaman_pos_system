import {
  InputAdornment,
  TextField,
  type TextFieldProps,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";

function SearchInput(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      placeholder={props.placeholder ?? "Search..."}
      size={props.size ?? "small"}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          ...props.slotProps?.input,
        },
      }}
    />
  );
}

export default SearchInput;