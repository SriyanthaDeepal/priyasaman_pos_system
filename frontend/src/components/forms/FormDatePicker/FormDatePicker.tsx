
import {
  TextField,
  type TextFieldProps,
} from "@mui/material";

type FormDatePickerProps = Omit<
  TextFieldProps,
  "type" | "select" | "children"
> & {
  minDate?: string;
  maxDate?: string;
};

function FormDatePicker({
  label,
  value,
  defaultValue,
  minDate,
  maxDate,
  size = "small",
  variant = "outlined",
  fullWidth = true,
  slotProps,
  ...props
}: FormDatePickerProps) {
  return (
    <TextField
      {...props}
      type="date"
      label={label}
      value={value}
      defaultValue={defaultValue}
      size={size}
      variant={variant}
      fullWidth={fullWidth}
      slotProps={{
        ...slotProps,

        inputLabel: {
          ...slotProps?.inputLabel,
          shrink: true,
        },

        htmlInput: {
          ...slotProps?.htmlInput,
          min: minDate,
          max: maxDate,
        },
      }}
    />
  );
}

export default FormDatePicker;
