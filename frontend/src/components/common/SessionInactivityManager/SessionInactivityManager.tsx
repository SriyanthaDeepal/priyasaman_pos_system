
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  AccessTimeOutlined,
  LockOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export interface SessionInactivityManagerProps {
  enabled?: boolean;
  locked?: boolean;

  timeoutMs?: number;
  warningMs?: number;

  onLock: () => void;
  onStayActive?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_WARNING_MS = 60 * 1000;

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

// ============================================
// COMPONENT
// ============================================

export default function SessionInactivityManager({
  enabled = true,
  locked = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  warningMs = DEFAULT_WARNING_MS,
  onLock,
  onStayActive,
}: SessionInactivityManagerProps) {
  const effectiveTimeout = Math.max(
    1000,
    timeoutMs
  );

  const effectiveWarning = Math.max(
    0,
    Math.min(
      warningMs,
      effectiveTimeout - 1000
    )
  );

  // No impure functions during render.
  const lastActivityRef = useRef<number>(0);
  const lockTriggeredRef = useRef(false);
  const warningActiveRef = useRef(false);

  const onLockRef = useRef(onLock);
  const onStayActiveRef = useRef(onStayActive);

  const [remainingMs, setRemainingMs] =
    useState(effectiveTimeout);

  const [warningOpen, setWarningOpen] =
    useState(false);

  // ============================================
  // KEEP CALLBACKS CURRENT
  // ============================================

  useEffect(() => {
    onLockRef.current = onLock;
    onStayActiveRef.current = onStayActive;
  }, [onLock, onStayActive]);

  // ============================================
  // RESET ACTIVITY
  // ============================================

  const resetActivity = () => {
    lastActivityRef.current = Date.now();
    lockTriggeredRef.current = false;
    warningActiveRef.current = false;

    setRemainingMs(effectiveTimeout);
    setWarningOpen(false);
  };

  // ============================================
  // ACTIVITY MONITORING
  // ============================================

  useEffect(() => {
    if (!enabled || locked) {
      return;
    }

    // Initialize timestamps without calling
    // React state setters in the effect body.
    lastActivityRef.current = Date.now();
    lockTriggeredRef.current = false;
    warningActiveRef.current = false;

    const handleActivity = () => {
      // Once warning begins, require explicit
      // confirmation through Stay Active.
      if (warningActiveRef.current) {
        return;
      }

      const elapsed =
        Date.now() - lastActivityRef.current;

      if (
        effectiveWarning > 0 &&
        elapsed >=
          effectiveTimeout - effectiveWarning
      ) {
        return;
      }

      lastActivityRef.current = Date.now();
    };

    const checkInactivity = () => {
      const elapsed =
        Date.now() - lastActivityRef.current;

      const remaining = Math.max(
        0,
        effectiveTimeout - elapsed
      );

      setRemainingMs(remaining);

      // Automatically lock.
      if (remaining <= 0) {
        if (!lockTriggeredRef.current) {
          lockTriggeredRef.current = true;
          warningActiveRef.current = false;
          setWarningOpen(false);

          onLockRef.current();
        }

        return;
      }

      // Display warning.
      const shouldWarn =
        effectiveWarning > 0 &&
        remaining <= effectiveWarning;

      if (
        shouldWarn !== warningActiveRef.current
      ) {
        warningActiveRef.current = shouldWarn;
        setWarningOpen(shouldWarn);
      }
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(
        eventName,
        handleActivity,
        { passive: true }
      );
    });

    const intervalId = window.setInterval(
      checkInactivity,
      250
    );

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkInactivity();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(intervalId);

      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          handleActivity
        );
      });

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    enabled,
    locked,
    effectiveTimeout,
    effectiveWarning,
  ]);

  // ============================================
  // STAY ACTIVE
  // ============================================

  const handleStayActive = () => {
    resetActivity();
    onStayActiveRef.current?.();
  };

  // ============================================
  // MANUAL LOCK
  // ============================================

  const handleLockNow = () => {
    if (lockTriggeredRef.current) {
      return;
    }

    lockTriggeredRef.current = true;
    warningActiveRef.current = false;

    setWarningOpen(false);
    onLockRef.current();
  };

  // ============================================
  // COUNTDOWN
  // ============================================

  const remainingSeconds = Math.ceil(
    remainingMs / 1000
  );

  const progress =
    effectiveWarning > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (remainingMs / effectiveWarning) * 100
          )
        )
      : 0;

  // ============================================
  // RENDER
  // ============================================

  return (
    <Dialog
      open={
        enabled &&
        !locked &&
        warningOpen
      }
      maxWidth="xs"
      fullWidth
      onClose={() => {
        // Prevent Escape or backdrop dismissal.
        // Cashier must explicitly choose an action.
      }}
    >
      <DialogTitle>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center" }}
        >
          <AccessTimeOutlined color="warning" />

          <Typography
            component="span"
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Terminal About to Lock
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            This POS terminal has been inactive.
            It will lock automatically to protect
            your session.
          </Typography>

          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h3"
              sx={{ fontWeight: 700 }}
            >
              {remainingSeconds}s
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              Remaining before automatic lock
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            color="warning"
            sx={{
              height: 8,
              borderRadius: 2,
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Your active billing cart will remain
            preserved while the terminal is locked.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          color="inherit"
          startIcon={<LockOutlined />}
          onClick={handleLockNow}
        >
          Lock Now
        </Button>

        <Button
          variant="contained"
          onClick={handleStayActive}
        >
          Stay Active
        </Button>
      </DialogActions>
    </Dialog>
  );
}
