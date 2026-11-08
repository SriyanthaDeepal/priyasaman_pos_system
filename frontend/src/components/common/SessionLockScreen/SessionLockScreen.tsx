
import { useState, type FormEvent } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
} from "@mui/material";

import {
  LockOutlined,
  LockOpenOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  LogoutOutlined,
  PersonOutlineOutlined,
  WifiOutlined,
  WifiOffOutlined,
  StorefrontOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type UnlockMethod = "pin" | "password";

export interface LockedUser {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface SessionLockScreenProps {
  user: LockedUser;
  terminalName?: string;
  storeName?: string;

  unlockMethod?: UnlockMethod;
  online?: boolean;

  error?: string | null;
  loading?: boolean;

  onUnlock: (
    credential: string
  ) => Promise<boolean>;

  onSwitchUser?: () => void;
  onLogout?: () => void;

  onUnlocked?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export default function SessionLockScreen({
  user,
  terminalName = "POS Terminal",
  storeName = "Priyasaman POS",
  unlockMethod = "pin",
  online = true,
  error = null,
  loading = false,
  onUnlock,
  onSwitchUser,
  onLogout,
  onUnlocked,
}: SessionLockScreenProps) {
  const [credential, setCredential] = useState("");
  const [showCredential, setShowCredential] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [localError, setLocalError] = useState<
    string | null
  >(null);

  const isBusy = loading || submitting;

  const isPin = unlockMethod === "pin";

  // ==========================================
  // UNLOCK
  // ==========================================

  const handleUnlock = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isBusy || !credential.trim()) {
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      const success = await onUnlock(credential);

      if (success) {
        setCredential("");
        setShowCredential(false);
        onUnlocked?.();
      } else {
        setLocalError("Incorrect credential. Try again.");
        setCredential("");
      }
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to unlock the terminal."
      );

      setCredential("");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: (theme) => theme.zIndex.modal + 10,
        minHeight: "100dvh",
        bgcolor: "#101827",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        p: { xs: 2, sm: 3 },
        overflowY: "auto",
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center" }}
        >
          <StorefrontOutlined />

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700 }}
          >
            {storeName}
          </Typography>
        </Stack>

        <Chip
          size="small"
          icon={
            online ? (
              <WifiOutlined />
            ) : (
              <WifiOffOutlined />
            )
          }
          label={online ? "Online" : "Offline"}
          sx={{
            color: "#fff",
            bgcolor: online
              ? "rgba(46, 125, 50, 0.45)"
              : "rgba(237, 108, 2, 0.4)",
            "& .MuiChip-icon": {
              color: "#fff",
            },
          }}
        />
      </Box>

      {/* CENTER CONTENT */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: "100%",
            maxWidth: 430,
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
          }}
        >
          <Stack
            spacing={3}
            sx={{ alignItems: "center" }}
          >
            {/* LOCK ICON */}
            <Avatar
              sx={{
                width: 72,
                height: 72,
                bgcolor: "primary.light",
                color: "primary.main",
              }}
            >
              <LockOutlined sx={{ fontSize: 34 }} />
            </Avatar>

            {/* TITLE */}
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700 }}
              >
                Terminal Locked
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Authenticate to continue your session.
              </Typography>
            </Box>

            {/* USER */}
            <Stack
              spacing={1}
              sx={{ alignItems: "center" }}
            >
              <Avatar
                src={user.avatarUrl}
                alt={user.name}
                sx={{
                  width: 56,
                  height: 56,
                }}
              >
                <PersonOutlineOutlined />
              </Avatar>

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700 }}
              >
                {user.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {user.role} · {terminalName}
              </Typography>
            </Stack>

            {/* ERROR */}
            {(localError || error) && (
              <Alert
                severity="error"
                sx={{ width: "100%" }}
              >
                {localError || error}
              </Alert>
            )}

            {/* UNLOCK FORM */}
            <Box
              component="form"
              onSubmit={handleUnlock}
              sx={{ width: "100%" }}
            >
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  autoFocus
                  label={
                    isPin
                      ? "Enter your PIN"
                      : "Enter your password"
                  }
                  type={
                    showCredential
                      ? "text"
                      : "password"
                  }
                  value={credential}
                  disabled={isBusy}
                  autoComplete="off"
                  inputMode={
                    isPin ? "numeric" : "text"
                  }
                  onChange={(event) => {
                    const nextValue =
                      event.target.value;

                    if (
                      isPin &&
                      !/^\d*$/.test(nextValue)
                    ) {
                      return;
                    }

                    setCredential(nextValue);
                    setLocalError(null);
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            disabled={isBusy}
                            onClick={() =>
                              setShowCredential(
                                (previous) => !previous
                              )
                            }
                            aria-label={
                              showCredential
                                ? "Hide credential"
                                : "Show credential"
                            }
                          >
                            {showCredential ? (
                              <VisibilityOffOutlined />
                            ) : (
                              <VisibilityOutlined />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="large"
                  variant="contained"
                  disabled={
                    isBusy || !credential.trim()
                  }
                  startIcon={
                    isBusy ? (
                      <CircularProgress
                        size={18}
                        color="inherit"
                      />
                    ) : (
                      <LockOpenOutlined />
                    )
                  }
                >
                  {isBusy
                    ? "Verifying..."
                    : "Unlock Terminal"}
                </Button>
              </Stack>
            </Box>

            {/* SECONDARY ACTIONS */}
            {(onSwitchUser || onLogout) && (
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {onSwitchUser && (
                  <Button
                    size="small"
                    color="inherit"
                    disabled={isBusy}
                    startIcon={
                      <PersonOutlineOutlined />
                    }
                    onClick={onSwitchUser}
                  >
                    Switch User
                  </Button>
                )}

                {onLogout && (
                  <Button
                    size="small"
                    color="inherit"
                    disabled={isBusy}
                    startIcon={<LogoutOutlined />}
                    onClick={onLogout}
                  >
                    Log Out
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>
      </Box>

      {/* FOOTER */}
      <Typography
        variant="caption"
        sx={{
          textAlign: "center",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        Your active billing session is preserved
        while this terminal is locked.
      </Typography>
    </Box>
  );
}
