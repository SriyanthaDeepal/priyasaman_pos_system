import { Alert, Snackbar } from "@mui/material";
import type { AlertColor } from "@mui/material";

type FeedbackSnackbarProps = {
  open: boolean;
  message: string;
  severity?: AlertColor;
  onClose: () => void;
};

export default function FeedbackSnackbar({
  open,
  message,
  severity = "success",
  onClose,
}: FeedbackSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4500}
      onClose={(_, reason) => {
        if (reason !== "clickaway") onClose();
      }}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
