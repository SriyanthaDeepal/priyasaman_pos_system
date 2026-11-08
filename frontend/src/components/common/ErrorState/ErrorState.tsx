import { Box, Button, Typography } from "@mui/material";
import { ErrorOutlined as ErrorOutlineIcon } from "@mui/icons-material";
import type { ReactNode } from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  onRetry?: () => void;
}

function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load the requested data. Please try again.",
  action,
  onRetry,
}: ErrorStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 3,
        textAlign: "center",
      }}
    >
      <ErrorOutlineIcon
        sx={{
          fontSize: 56,
          color: "error.main",
          mb: 2,
        }}
      />

      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 1,
          maxWidth: 450,
        }}
      >
        {message}
      </Typography>

      {onRetry && (
        <Button
          variant="contained"
          onClick={onRetry}
          sx={{ mt: 3 }}
        >
          Try Again
        </Button>
      )}

      {action && (
        <Box sx={{ mt: onRetry ? 1 : 3 }}>
          {action}
        </Box>
      )}
    </Box>
  );
}

export default ErrorState;