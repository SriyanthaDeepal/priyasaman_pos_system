
import {
  Alert,
  Snackbar,
  type AlertColor,
  type SnackbarOrigin,
} from "@mui/material";

export interface AppSnackbarProps {
  open: boolean;
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
  position?: SnackbarOrigin;
  onClose: () => void;
}

function AppSnackbar({
  open,
  message,
  severity = "success",
  autoHideDuration = 4000,
  position = {
    vertical: "bottom",
    horizontal: "right",
  },
  onClose,
}: AppSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      anchorOrigin={position}
      onClose={(_, reason) => {
        if (reason === "clickaway") return;
        onClose();
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: "100%",
          boxShadow: 3,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

export default AppSnackbar;
