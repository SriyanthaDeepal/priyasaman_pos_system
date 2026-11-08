import { Box, Typography } from "@mui/material";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
}

function EmptyState({
  title = "No data found",
  message = "There is currently no data to display.",
  action,
}: EmptyStateProps) {
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
      <InboxOutlinedIcon
        sx={{
          fontSize: 56,
          color: "text.secondary",
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

      {action && (
        <Box sx={{ mt: 3 }}>
          {action}
        </Box>
      )}
    </Box>
  );
}

export default EmptyState;