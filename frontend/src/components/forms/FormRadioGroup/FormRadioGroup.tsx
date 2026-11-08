
import type { ReactNode } from "react";

import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  type RadioGroupProps,
} from "@mui/material";

export interface FormRadioOption {
  label: ReactNode;
  value: string;
  disabled?: boolean;
}

export interface FormRadioGroupProps
  extends Omit<RadioGroupProps, "onChange" | "children"> {
  label?: string;
  options: FormRadioOption[];
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

function FormRadioGroup({
  label,
  options,
  helperText,
  error = false,
  required = false,
  disabled = false,
  onChange,
  row = false,
  ...props
}: FormRadioGroupProps) {
  return (
    <FormControl
      error={error}
      required={required}
      disabled={disabled}
    >
      {label && (
        <FormLabel sx={{ mb: 1 }}>
          {label}
        </FormLabel>
      )}

      <RadioGroup
        {...props}
        row={row}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio size="small" />}
            label={option.label}
            disabled={option.disabled}
          />
        ))}
      </RadioGroup>

      {helperText && (
        <FormHelperText>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}

export default FormRadioGroup;
