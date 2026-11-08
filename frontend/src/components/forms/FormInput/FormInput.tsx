
import {
  TextField,
  type TextFieldProps,
} from "@mui/material";

type FormInputProps = TextFieldProps;

function FormInput({
  variant = "outlined",
  size = "small",
  fullWidth = true,
  ...props
}: FormInputProps) {
  return (
    <TextField
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      {...props}
    />
  );
}

export default FormInput;
