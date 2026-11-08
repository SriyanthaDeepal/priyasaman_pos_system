import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}
    >
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {action && (
        <Box>
          {action}
        </Box>
      )}
    </Box>
  );
}

export default PageHeader;