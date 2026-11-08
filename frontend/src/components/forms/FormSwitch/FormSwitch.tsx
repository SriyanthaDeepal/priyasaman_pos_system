
import type { ReactNode } from "react";

import {
  Switch,
  FormControl,
  FormControlLabel,
  FormHelperText,
  type SwitchProps,
} from "@mui/material";

export interface FormSwitchProps
  extends Omit<SwitchProps, "onChange"> {
  label: ReactNode;
  helperText?: string;
  error?: boolean;
  onChange?: (checked: boolean) => void;
}

function FormSwitch({
  label,
  helperText,
  error = false,
  checked,
  onChange,
  disabled = false,
  size = "small",
  color = "primary",
  ...props
}: FormSwitchProps) {
  return (
    <FormControl
      error={error}
      disabled={disabled}
    >
      <FormControlLabel
        control={
          <Switch
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

export default FormSwitch;
