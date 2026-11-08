import { Box, CircularProgress } from "@mui/material";

interface LoadingSpinnerProps {
  size?: number;
  fullScreen?: boolean;
}

function LoadingSpinner({
  size = 40,
  fullScreen = false,
}: LoadingSpinnerProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...(fullScreen && {
          width: "100%",
          height: "100%",
          minHeight: "200px",
        }),
      }}
    >
      <CircularProgress size={size} />
    </Box>
  );
}

export default LoadingSpinner;