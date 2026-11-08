
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  type CheckboxProps,
} from "@mui/material";

import type { ReactNode } from "react";

export interface FormCheckboxProps
  extends Omit<CheckboxProps, "onChange"> {
  label: ReactNode;
  helperText?: string;
  error?: boolean;
  onChange?: (checked: boolean) => void;
}

function FormCheckbox({
  label,
  helperText,
  error = false,
  checked,
  onChange,
  disabled = false,
  size = "small",
  color = "primary",
  ...props
}: FormCheckboxProps) {
  return (
    <FormControl error={error} disabled={disabled}>
      <FormControlLabel
        control={
          <Checkbox
            {...props}
            checked={checked}
            onChange={(event) =>
              onChange?.(event.target.checked)
            }
            disabled={disabled}
            size={size}
            color={color}
          />
        }
        label={label}
      />

      {helperText && (
        <FormHelperText sx={{ ml: 0 }}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}

export default FormCheckbox;
