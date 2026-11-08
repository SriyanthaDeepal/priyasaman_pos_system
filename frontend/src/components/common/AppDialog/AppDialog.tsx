
import type { ReactNode } from "react";
import { useId } from "react";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import type { DialogProps } from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

export interface AppDialogProps
  extends Omit<
    DialogProps,
    "open" | "onClose" | "title" | "children"
  > {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;

  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;

  showCloseButton?: boolean;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;

  confirmDisabled?: boolean;
  loading?: boolean;

  preventBackdropClose?: boolean;
  preventEscapeClose?: boolean;

  actions?: ReactNode;
}

function AppDialog({
  open,
  onClose,
  title,
  description,
  children,

  onConfirm,
  confirmText = "Save",
  cancelText = "Cancel",

  showCloseButton = true,
  showCancelButton = true,
  showConfirmButton = true,

  confirmDisabled = false,
  loading = false,

  preventBackdropClose = false,
  preventEscapeClose = false,

  actions,
  maxWidth = "sm",
  fullWidth = true,
  fullScreen,

  ...props
}: AppDialogProps) {
  const theme = useTheme();

  const isMobile = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const titleId = useId();
  const descriptionId = useId();

  const handleClose: DialogProps["onClose"] = (
    _event,
    reason
  ) => {
    if (loading) return;

    if (
      preventBackdropClose &&
      reason === "backdropClick"
    ) {
      return;
    }

    if (
      preventEscapeClose &&
      reason === "escapeKeyDown"
    ) {
      return;
    }

    onClose();
  };

  const handleCancel = () => {
    if (loading) return;
    onClose();
  };

  const handleConfirm = () => {
    if (loading || confirmDisabled || !onConfirm) {
      return;
    }

    onConfirm();
  };

  const showActions =
    actions !== undefined ||
    showCancelButton ||
    showConfirmButton;

  return (
    <Dialog
      {...props}
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen ?? isMobile}
      aria-labelledby={titleId}
      aria-describedby={
        description ? descriptionId : undefined
      }
    >
      <DialogTitle
        id={titleId}
        sx={{
          pr: showCloseButton ? 6 : 3,
          pb: description ? 1 : 2,
        }}
      >
        <Typography
          component="span"
          variant="h6"
          sx={{ fontWeight: 600 }}
        >
          {title}
        </Typography>

        {showCloseButton && (
          <IconButton
            aria-label="Close dialog"
            onClick={handleCancel}
            disabled={loading}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {description && (
          <DialogContentText
            id={descriptionId}
            sx={{
              mb: children ? 2 : 0,
            }}
          >
            {description}
          </DialogContentText>
        )}

        {children && (
          <Box sx={{ pt: 0.5 }}>
            {children}
          </Box>
        )}
      </DialogContent>

      {showActions && (
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1,
          }}
        >
          {actions !== undefined ? (
            actions
          ) : (
            <>
              {showCancelButton && (
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  disabled={loading}
                  onClick={handleCancel}
                >
                  {cancelText}
                </Button>
              )}

              {showConfirmButton && (
                <Button
                  type="button"
                  variant="contained"
                  disabled={
                    loading ||
                    confirmDisabled ||
                    !onConfirm
                  }
                  onClick={handleConfirm}
                  startIcon={
                    loading ? (
                      <CircularProgress
                        size={16}
                        color="inherit"
                      />
                    ) : undefined
                  }
                >
                  {loading
                    ? "Processing..."
                    : confirmText}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}

export default AppDialog;
