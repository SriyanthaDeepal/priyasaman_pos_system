
import type { ReactNode } from "react";

import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";

import type {
  ChipProps,
  SxProps,
  Theme,
} from "@mui/material";

import CloseOutlined from "@mui/icons-material/CloseOutlined";

export interface DetailDrawerField {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
}

export interface DetailDrawerSection {
  title: string;
  fields: DetailDrawerField[];
  columns?: 1 | 2;
}

export interface DetailDrawerAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "text" | "outlined" | "contained";
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "inherit";
  disabled?: boolean;
}

export interface DetailDrawerStatus {
  label: string;
  color?: ChipProps["color"];
}

export interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;

  title: string;
  subtitle?: string;

  icon?: ReactNode;
  image?: string;
  imageAlt?: string;

  status?: DetailDrawerStatus;
  sections: DetailDrawerSection[];

  actions?: DetailDrawerAction[];
  loading?: boolean;

  anchor?: "left" | "right";
  width?: number | string;

  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;

  sx?: SxProps<Theme>;
}

function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  image,
  imageAlt = "",
  status,
  sections,
  actions = [],
  loading = false,
  anchor = "right",
  width = 480,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  sx,
}: DetailDrawerProps) {
  const handleDrawerClose = (
    _event: object,
    reason: "backdropClick" | "escapeKeyDown"
  ) => {
    if (
      reason === "backdropClick" &&
      !closeOnBackdropClick
    ) {
      return;
    }

    if (
      reason === "escapeKeyDown" &&
      !closeOnEscape
    ) {
      return;
    }

    onClose();
  };

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={handleDrawerClose}
      slotProps={{
        paper: {
          sx: [
            {
              width: {
                xs: "100%",
                sm: width,
              },
              maxWidth: "100vw",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
            ...(Array.isArray(sx)
              ? sx
              : sx
                ? [sx]
                : []),
          ],
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          px: 3,
          py: 2.5,
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
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
        </Box>

        <IconButton
          aria-label="Close details"
          onClick={onClose}
          size="small"
        >
          <CloseOutlined />
        </IconButton>
      </Box>

      <Divider />

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 3,
          py: 3,
          minHeight: 0,
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Skeleton
                variant="rounded"
                width={64}
                height={64}
              />

              <Box sx={{ flex: 1 }}>
                <Skeleton width="75%" height={28} />
                <Skeleton width="45%" height={20} />
              </Box>
            </Box>

            {[0, 1].map((section) => (
              <Box key={section}>
                <Skeleton width="55%" height={28} />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 2,
                    mt: 2,
                  }}
                >
                  {[0, 1, 2, 3].map((field) => (
                    <Box key={field}>
                      <Skeleton width="65%" height={18} />
                      <Skeleton width="85%" height={25} />
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {/* Record Summary */}
            {(icon || image || status) && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  {(icon || image) && (
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        flexShrink: 0,
                        borderRadius: 2,
                        bgcolor: "action.hover",
                        color: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        "& svg": {
                          fontSize: 34,
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

                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600 }}
                    >
                      {title}
                    </Typography>

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

                <Divider />
              </>
            )}

            {/* Sections */}
            {sections.map((section, sectionIndex) => {
              const columns = section.columns ?? 2;

              return (
                <Box key={`${section.title}-${sectionIndex}`}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                    }}
                  >
                    {section.title}
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        columns === 2
                          ? "repeat(2, minmax(0, 1fr))"
                          : "1fr",
                      gap: 2.5,
                    }}
                  >
                    {section.fields.map((field, index) => (
                      <Box
                        key={`${field.label}-${index}`}
                        sx={{
                          minWidth: 0,
                          gridColumn: field.fullWidth
                            ? "1 / -1"
                            : "auto",
                        }}
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

                  {sectionIndex < sections.length - 1 && (
                    <Divider sx={{ mt: 3 }} />
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Fixed Footer */}
      {!loading && actions.length > 0 && (
        <>
          <Divider />

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              flexWrap: "wrap",
              px: 3,
              py: 2,
              bgcolor: "background.paper",
            }}
          >
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              onClick={onClose}
            >
              Close
            </Button>

            {actions.map((action, index) => (
              <Button
                key={`${action.label}-${index}`}
                type="button"
                variant={action.variant ?? "contained"}
                color={action.color ?? "primary"}
                startIcon={action.icon}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </>
      )}
    </Drawer>
  );
}

export default DetailDrawer;
