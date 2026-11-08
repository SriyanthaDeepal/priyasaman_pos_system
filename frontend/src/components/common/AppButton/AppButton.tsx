import { Button, type ButtonProps } from "@mui/material";

function AppButton(props: ButtonProps) {
  return (
    <Button
      variant="contained"
      {...props}
    />
  );
}

export default AppButton;