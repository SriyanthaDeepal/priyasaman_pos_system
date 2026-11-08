
import {
  Autocomplete,
  TextField,
  createFilterOptions,
  type AutocompleteProps,
} from "@mui/material";

export interface FormAutocompleteOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

type MuiAutocompleteProps = AutocompleteProps<
  FormAutocompleteOption,
  false,
  false,
  false
>;

export interface FormAutocompleteProps
  extends Omit<
    MuiAutocompleteProps,
    | "renderInput"
    | "options"
    | "onChange"
    | "value"
    | "getOptionLabel"
    | "filterOptions"
    | "getOptionDisabled"
    | "isOptionEqualToValue"
  > {
  label: string;
  options: FormAutocompleteOption[];
  value: FormAutocompleteOption | null;
  onChange: (option: FormAutocompleteOption | null) => void;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  matchFrom?: "start" | "any";
}

const startFilter = createFilterOptions<FormAutocompleteOption>({
  matchFrom: "start",
  stringify: (option) => option.label,
  ignoreCase: true,
  trim: true,
});

const anywhereFilter = createFilterOptions<FormAutocompleteOption>({
  matchFrom: "any",
  stringify: (option) => option.label,
  ignoreCase: true,
  trim: true,
});

function FormAutocomplete({
  label,
  options,
  value,
  onChange,
  placeholder = "Search and select...",
  helperText,
  error = false,
  required = false,
  matchFrom = "any",
  loading = false,
  disabled = false,
  size = "small",
  ...props
}: FormAutocompleteProps) {
  return (
    <Autocomplete
      {...props}
      options={options}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      filterOptions={
        matchFrom === "start" ? startFilter : anywhereFilter
      }
      loading={loading}
      disabled={disabled}
      size={size}
      getOptionLabel={(option) => option.label}
      getOptionDisabled={(option) =>
        option.disabled ?? false
      }
      isOptionEqualToValue={(option, selected) =>
        option.value === selected.value
      }
      noOptionsText="No matching options found"
      loadingText="Loading options..."
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
}

export default FormAutocomplete;
