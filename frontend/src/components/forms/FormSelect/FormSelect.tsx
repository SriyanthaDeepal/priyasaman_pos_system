
import {
  TextField,
  MenuItem,
  type TextFieldProps,
} from "@mui/material";

// Values supported by the dropdown
export type SelectValue = string | number;

// Individual dropdown option
export interface FormSelectOption {
  label: string;
  value: SelectValue;
  disabled?: boolean;
}

// Component properties
type FormSelectProps = Omit<
  TextFieldProps,
  "select" | "children"
> & {
  options: FormSelectOption[];
  placeholder?: string;
};

function FormSelect({
  options,
  placeholder = "Select an option",
  variant = "outlined",
  size = "small",
  fullWidth = true,
  value,
  defaultValue,
  ...props
}: FormSelectProps) {
  return (
    <TextField
      {...props}
      select
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      value={value}
      defaultValue={
        value === undefined
          ? (defaultValue ?? "")
          : undefined
      }
      slotProps={{
        ...props.slotProps,
        select: {
          displayEmpty: true,
          ...props.slotProps?.select,
        },
      }}
    >
      <MenuItem value="" disabled>
        <em>{placeholder}</em>
      </MenuItem>

      {options.map((option) => (
        <MenuItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default FormSelect;
