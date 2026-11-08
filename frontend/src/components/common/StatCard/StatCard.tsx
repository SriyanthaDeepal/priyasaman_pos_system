
import type { ReactNode } from "react";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Skeleton,
  Typography,
} from "@mui/material";

import type { SxProps, Theme } from "@mui/material";

import {
  ArrowDownward,
  ArrowUpward,
  Remove,
} from "@mui/icons-material";

export type StatTrend = "up" | "down" | "neutral";

export type StatTrendStatus =
  | "positive"
  | "negative"
  | "neutral";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;

  trend?: StatTrend;
  trendValue?: string;
  trendStatus?: StatTrendStatus;
  trendLabel?: string;

  description?: string;

  iconColor?: string;
  iconBackgroundColor?: string;

  loading?: boolean;
  onClick?: () => void;

  sx?: SxProps<Theme>;
}

function StatCard({
  title,
  value,
  icon,

  trend = "neutral",
  trendValue,
  trendStatus = "neutral",
  trendLabel,

  description,

  iconColor = "primary.main",
  iconBackgroundColor = "action.hover",

  loading = false,
  onClick,
  sx,
}: StatCardProps) {
  const trendColors: Record<
    StatTrendStatus,
    string
  > = {
    positive: "success.main",
    negative: "error.main",
    neutral: "text.secondary",
  };

  const trendColor = trendColors[trendStatus];

  const trendIcon =
    trend === "up" ? (
      <ArrowUpward sx={{ fontSize: 15 }} />
    ) : trend === "down" ? (
      <ArrowDownward sx={{ fontSize: 15 }} />
    ) : (
      <Remove sx={{ fontSize: 15 }} />
    );

  const content = (
    <CardContent
      sx={{
        p: 2.5,
        "&:last-child": {
          pb: 2.5,
        },
      }}
    >
      {loading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Skeleton
              variant="text"
              width="55%"
              height={25}
            />

            <Skeleton
              variant="rounded"
              width={44}
              height={44}
            />
          </Box>

          <Skeleton
            variant="text"
            width="70%"
            height={45}
          />

          <Skeleton
            variant="text"
            width="45%"
            height={22}
          />
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Title and icon */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                pt: 0.5,
              }}
            >
              {title}
            </Typography>

            {icon && (
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  flexShrink: 0,
                  borderRadius: 2,
                  bgcolor: iconBackgroundColor,
                  color: iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "& svg": {
                    fontSize: 25,
                  },
                }}
              >
                {icon}
              </Box>
            )}
          </Box>

          {/* Statistic value */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {value}
          </Typography>

          {/* Trend and comparison */}
          {(trendValue || trendLabel) && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {trendValue && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.3,
                    color: trendColor,
                  }}
                >
                  {trendIcon}

                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: "inherit",
                    }}
                  >
                    {trendValue}
                  </Typography>
                </Box>
              )}

              {trendLabel && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {trendLabel}
                </Typography>
              )}
            </Box>
          )}

          {/* Optional description */}
          {description && (
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {description}
            </Typography>
          )}
        </Box>
      )}
    </CardContent>
  );

  return (
    <Card
      variant="outlined"
      sx={[
        {
          height: "100%",
          borderRadius: 2,
          transition:
            "box-shadow 0.2s, transform 0.2s",
          ...(onClick && !loading
            ? {
                "&:hover": {
                  boxShadow: 3,
                  transform: "translateY(-2px)",
                },
              }
            : {}),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {onClick && !loading ? (
        <CardActionArea
          onClick={onClick}
          sx={{ height: "100%" }}
        >
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}

export default StatCard;
