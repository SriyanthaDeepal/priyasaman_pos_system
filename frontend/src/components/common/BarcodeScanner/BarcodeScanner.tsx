
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
  TextField,
} from "@mui/material";

import {
  CameraAltOutlined,
  CloseOutlined,
  KeyboardOutlined,
  QrCodeScannerOutlined,
} from "@mui/icons-material";

import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";

import {
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";

export interface BarcodeScannerProps {
  onScan: (barcode: string) => void | Promise<void>;
  label?: string;
  submitLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  enableCamera?: boolean;
  maxLength?: number;
  duplicateDelayMs?: number;
  compact?: boolean;
}

const SUPPORTED_FORMATS = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.QR_CODE,
];

function BarcodeScanner({
  onScan,
  label = "Scan Barcode",
  submitLabel = "Add",
  placeholder = "Scan or enter barcode...",
  disabled = false,
  autoFocus = true,
  enableCamera = true,
  maxLength = 100,
  duplicateDelayMs = 1000,
  compact = false,
}: BarcodeScannerProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const busyRef = useRef(false);
  const activeRef = useRef(false);
  const lastScanRef = useRef({
    value: "",
    time: 0,
  });

  const cameraSupported =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    "mediaDevices" in navigator;

  const stopCamera = () => {
    activeRef.current = false;

    controlsRef.current?.stop();
    controlsRef.current = null;

    readerRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    setCameraStarting(false);
  };

  const submitBarcode = async (rawValue: string) => {
    const barcode = rawValue.trim();

    if (disabled || busyRef.current) {
      return false;
    }

    if (!barcode) {
      setError("Please enter or scan a barcode.");
      return false;
    }

    if (barcode.length > maxLength) {
      setError(`Barcode cannot exceed ${maxLength} characters.`);
      return false;
    }

    const now = Date.now();
    const last = lastScanRef.current;

    if (
      last.value === barcode &&
      now - last.time < duplicateDelayMs
    ) {
      return false;
    }

    busyRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      await onScan(barcode);

      lastScanRef.current = {
        value: barcode,
        time: Date.now(),
      };

      setValue("");
      inputRef.current?.focus();

      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process barcode."
      );

      return false;
    } finally {
      busyRef.current = false;
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitBarcode(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setValue("");
      setError("");
    }
  };

  const startCamera = async () => {
    if (!cameraSupported || disabled || cameraOpen) {
      return;
    }

    setError("");
    setCameraOpen(true);
    setCameraStarting(true);
    activeRef.current = true;

    // Allow React to mount the video element.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const video = videoRef.current;

    if (!video || !activeRef.current) {
      return;
    }

    try {
      const hints = new Map();

      hints.set(
        DecodeHintType.POSSIBLE_FORMATS,
        SUPPORTED_FORMATS
      );

      hints.set(
        DecodeHintType.TRY_HARDER,
        true
      );

      const reader = new BrowserMultiFormatReader(
        hints,
        {
          delayBetweenScanAttempts: 100,
          delayBetweenScanSuccess: 300,
        }
      );

      readerRef.current = reader;

      const controls =
        await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: {
                ideal: "environment",
              },
            },
          },
          video,
          (result) => {
            if (!result || !activeRef.current) {
              return;
            }

            const barcode = result.getText();

            void (async () => {
              const success =
                await submitBarcode(barcode);

              if (success && activeRef.current) {
                stopCamera();
              }
            })();
          }
        );

      if (!activeRef.current) {
        controls.stop();
        return;
      }

      controlsRef.current = controls;
      setCameraStarting(false);
    } catch (err) {
      stopCamera();

      setError(
        err instanceof Error
          ? err.message
          : "Unable to start camera scanner."
      );
    }
  };

  useEffect(() => {
    return () => {
      activeRef.current = false;
      controlsRef.current?.stop();
    };
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Paper
        variant={compact ? "elevation" : "outlined"}
        elevation={0}
        sx={{ p: compact ? 0 : 2, borderRadius: 2, bgcolor: "transparent" }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            gap: compact ? 1.5 : 1,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <TextField
            inputRef={inputRef}
            label={compact ? undefined : label}
            placeholder={placeholder}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || submitting}
            autoFocus={autoFocus}
            size={compact ? "medium" : "small"}
            sx={{
              flex: 1,
              minWidth: 200,
            }}
            slotProps={{
              htmlInput: {
                maxLength,
                autoComplete: "off",
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={disabled || submitting}
            startIcon={
              submitting ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : (
                <KeyboardOutlined />
              )
            }
            sx={{
              height: compact ? 46 : 40,
              whiteSpace: "nowrap",
              ...(compact && {
                bgcolor: "#007b15",
                color: "#fff",
                fontWeight: 750,
                fontSize: 12,
                borderRadius: "9px",
                textTransform: "none",
                px: 2,
                boxShadow: "0 2px 5px #1e293b14",
                "&:hover": { bgcolor: "#006312", boxShadow: "0 3px 9px #1e293b1f" },
                "&.Mui-disabled": { bgcolor: "#cce6d1" },
              }),
            }}
          >
            {submitLabel}
          </Button>

          {enableCamera && (
            <Button
              variant="outlined"
              startIcon={<CameraAltOutlined />}
              disabled={
                disabled ||
                submitting ||
                cameraOpen ||
                !cameraSupported
              }
              onClick={() => void startCamera()}
              sx={{
                height: compact ? 46 : 40,
                whiteSpace: "nowrap",
                ...(compact && {
                  borderColor: "#9ee6b1",
                  bgcolor: "#e4fae9",
                  color: "#007b15",
                  fontWeight: 750,
                  fontSize: 12,
                  borderRadius: "9px",
                  textTransform: "none",
                  px: 2,
                  "&:hover": { borderColor: "#65cb81", bgcolor: "#d1f5dc" },
                }),
              }}
            >
              Camera
            </Button>
          )}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            mt: compact ? 1.5 : 1,
          }}
        >
          {compact ? "Supports USB/Bluetooth scanners and manual entry. Press Enter to search." : "Scan using USB/Bluetooth or enter the barcode manually."}
        </Typography>
      </Paper>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {cameraOpen && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>
              Camera Barcode Scanner
            </Typography>

            <IconButton
              onClick={stopCamera}
              aria-label="Close camera"
            >
              <CloseOutlined />
            </IconButton>
          </Box>

          <Box
            sx={{
              position: "relative",
              bgcolor: "#111",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              component="video"
              ref={videoRef}
              autoPlay
              muted
              playsInline
              sx={{
                display: "block",
                width: "100%",
                maxHeight: 360,
                objectFit: "contain",
              }}
            />

            {cameraStarting && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(0,0,0,0.5)",
                }}
              >
                <CircularProgress
                  sx={{ color: "#fff" }}
                />
              </Box>
            )}

            <QrCodeScannerOutlined
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 90,
                pointerEvents: "none",
              }}
            />
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1 }}
          >
            Position the barcode inside the camera view.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default BarcodeScanner;
