
import type { ReactNode } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Typography,
} from "@mui/material";

import type {
  ChipProps,
  SxProps,
  Theme,
} from "@mui/material";

export interface InfoCardField {
  label: string;
  value: ReactNode;
}

export interface InfoCardAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "text" | "outlined" | "contained";
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "info"
    | "warning"
    | "inherit";
  disabled?: boolean;
}

export interface InfoCardStatus {
  label: string;
  color?: ChipProps["color"];
}

export interface InfoCardProps {
  title: string;
  subtitle?: string;

  icon?: ReactNode;
  image?: string;
  imageAlt?: string;

  status?: InfoCardStatus;

  fields: InfoCardField[];
  actions?: InfoCardAction[];

  loading?: boolean;
  columns?: 1 | 2;

  sx?: SxProps<Theme>;
}

function InfoCard({
  title,
  subtitle,
  icon,
  image,
  imageAlt = "",

  status,
  fields,
  actions = [],

  loading = false,
  columns = 2,
  sx,
}: InfoCardProps) {
  const cardStyles: SxProps<Theme> = [
    {
      borderRadius: 2,
      height: "100%",
      minWidth: 0,
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  if (loading) {
    return (
      <Card variant="outlined" sx={cardStyles}>
        <CardContent sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              mb: 3,
            }}
          >
            <Skeleton
              variant="rounded"
              width={60}
              height={60}
            />

            <Box sx={{ flex: 1 }}>
              <Skeleton width="70%" height={28} />
              <Skeleton width="45%" height={20} />
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm:
                  columns === 2
                    ? "repeat(2, minmax(0, 1fr))"
                    : "1fr",
              },
              gap: 2,
            }}
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <Box key={index}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="85%" height={25} />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={cardStyles}>
      <CardContent
        sx={{
          p: 2.5,
          "&:last-child": {
            pb: 2.5,
          },
        }}
      >
        {/* Card Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            mb: 2,
          }}
        >
          {(image || icon) && (
            <Box
              sx={{
                width: 60,
                height: 60,
                flexShrink: 0,
                borderRadius: 2,
                bgcolor: "action.hover",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                color: "primary.main",
                "& svg": {
                  fontSize: 32,
                },
              }}
            >
              {image ? (
                <Box
                  component="img"
                  src={image}
                  alt={imageAlt || title}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                icon
              )}
            </Box>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                overflowWrap: "anywhere",
              }}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}

            {status && (
              <Chip
                label={status.label}
                color={status.color ?? "default"}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Information Fields */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm:
                columns === 2
                  ? "repeat(2, minmax(0, 1fr))"
                  : "1fr",
            },
            gap: 2,
          }}
        >
          {fields.map((field, index) => (
            <Box
              key={`${field.label}-${index}`}
              sx={{ minWidth: 0 }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  mb: 0.5,
                }}
              >
                {field.label}
              </Typography>

              <Box
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  overflowWrap: "anywhere",
                }}
              >
                {field.value}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />

            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {actions.map((action, index) => (
                <Button
                  key={`${action.label}-${index}`}
                  type="button"
                  variant={action.variant ?? "outlined"}
                  color={action.color ?? "primary"}
                  startIcon={action.icon}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  size="small"
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default InfoCard;
