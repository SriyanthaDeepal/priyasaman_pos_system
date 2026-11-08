
import { useState } from "react";

import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import {
  CloseOutlined,
  KeyboardOutlined,
} from "@mui/icons-material";

import type { KeyboardShortcut } from "./index";

export interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  title?: string;
}

export function KeyboardShortcutsDialog({
  open,
  onClose,
  shortcuts,
  title = "Keyboard Shortcuts",
}: KeyboardShortcutsDialogProps) {
  const [showDisabled, setShowDisabled] =
    useState(false);

  const visibleShortcuts = shortcuts.filter(
    (shortcut) =>
      showDisabled || shortcut.enabled !== false
  );

  const groups = Array.from(
    new Set(
      visibleShortcuts.map(
        (shortcut) => shortcut.group ?? "General"
      )
    )
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <KeyboardOutlined />

          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            {title}
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          aria-label="Close shortcuts"
        >
          <CloseOutlined />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Available keyboard actions
            </Typography>

            <Chip
              clickable
              size="small"
              variant="outlined"
              label={
                showDisabled
                  ? "Hide Disabled"
                  : "Show Disabled"
              }
              onClick={() =>
                setShowDisabled((previous) => !previous)
              }
            />
          </Box>

          {groups.map((group) => (
            <Box key={group}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                }}
              >
                {group}
              </Typography>

              <Stack spacing={1.5}>
                {visibleShortcuts
                  .filter(
                    (shortcut) =>
                      (shortcut.group ?? "General") ===
                      group
                  )
                  .map((shortcut) => (
                    <Box
                      key={shortcut.id}
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: 2,
                        opacity:
                          shortcut.enabled === false
                            ? 0.5
                            : 1,
                      }}
                    >
                      <Box>
                        <Typography variant="body2">
                          {shortcut.label}
                        </Typography>

                        {shortcut.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {shortcut.description}
                          </Typography>
                        )}
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          flexShrink: 0,
                        }}
                      >
                        {shortcut.keys
                          .split("+")
                          .map((key, index) => (
                            <Box
                              key={`${key}-${index}`}
                              component="kbd"
                              sx={{
                                px: 1,
                                py: 0.5,
                                bgcolor: "action.hover",
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                                fontSize: 12,
                                fontFamily: "monospace",
                              }}
                            >
                              {key.toUpperCase()}
                            </Box>
                          ))}
                      </Box>
                    </Box>
                  ))}
              </Stack>

              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}

          {visibleShortcuts.length === 0 && (
            <Alert severity="info">
              No shortcuts are available.
            </Alert>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
