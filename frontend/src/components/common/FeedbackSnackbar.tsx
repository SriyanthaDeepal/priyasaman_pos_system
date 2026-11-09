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
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      sx={{
        bottom: { xs: 20, sm: 24 },
        right: { xs: 12, sm: 24 },
        left: { xs: 12, sm: "auto" },
        maxWidth: { xs: "calc(100vw - 24px)", sm: 440 },
        zIndex: (theme) => theme.zIndex.snackbar,
      }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
