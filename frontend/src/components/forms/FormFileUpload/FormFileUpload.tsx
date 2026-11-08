
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  Close,
  CloudUploadOutlined,
  InsertDriveFileOutlined,
} from "@mui/icons-material";

export interface FormFileUploadProps {
  label?: string;
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  maxFiles?: number;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  disabled: boolean;
}

function FilePreview({
  file,
  onRemove,
  disabled,
}: FilePreviewProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage || !imageRef.current) return;

    const image = imageRef.current;
    const url = URL.createObjectURL(file);

    image.src = url;

    return () => {
      image.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [file, isImage]);

  return (
    <Paper
      variant="outlined"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 1.5,
        borderRadius: 2,
      }}
    >
      {isImage ? (
        <Box
          component="img"
          ref={imageRef}
          alt={file.name}
          sx={{
            width: 60,
            height: 60,
            objectFit: "cover",
            borderRadius: 1,
            bgcolor: "action.hover",
          }}
        />
      ) : (
        <InsertDriveFileOutlined
          color="action"
          sx={{ fontSize: 44 }}
        />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={file.name}
        >
          {file.name}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          {(file.size / (1024 * 1024)).toFixed(2)} MB
        </Typography>
      </Box>

      <IconButton
        size="small"
        disabled={disabled}
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
      >
        <Close fontSize="small" />
      </IconButton>
    </Paper>
  );
}

function FormFileUpload({
  label = "Upload Files",
  value,
  onChange,
  accept = "image/*",
  multiple = false,
  maxSizeMB = 5,
  maxFiles = 5,
  disabled = false,
  error = false,
  helperText,
}: FormFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] =
    useState<string | null>(null);

  const allowedTypes = accept
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);

  const isAllowedType = (file: File): boolean => {
    if (allowedTypes.length === 0) return true;

    return allowedTypes.some((type) => {
      if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type);
      }

      if (type.endsWith("/*")) {
        return file.type.toLowerCase().startsWith(
          type.slice(0, -1)
        );
      }

      return file.type.toLowerCase() === type;
    });
  };

  const processFiles = (incoming: File[]) => {
    if (disabled || incoming.length === 0) return;

    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of incoming) {
      if (!isAllowedType(file)) {
        errors.push(
          `${file.name}: unsupported file type`
        );
        continue;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        errors.push(
          `${file.name}: exceeds ${maxSizeMB} MB`
        );
        continue;
      }

      validFiles.push(file);
    }

    const combined = multiple
      ? [...value, ...validFiles]
      : validFiles.slice(0, 1);

    const uniqueFiles = combined.filter(
      (file, index, files) =>
        files.findIndex(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified
        ) === index
    );

    const limit = multiple ? Math.max(1, maxFiles) : 1;

    if (uniqueFiles.length > limit) {
      errors.push(
        `Maximum ${limit} file(s) allowed`
      );
    }

    const nextFiles = uniqueFiles.slice(0, limit);

    if (validFiles.length > 0) {
      onChange(nextFiles);
    }

    setValidationError(
      errors.length > 0 ? errors.join(". ") : null
    );
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);

    processFiles(files);

    // Allows selecting the same file again.
    event.target.value = "";
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setDragging(false);

    if (disabled) return;

    processFiles(
      Array.from(event.dataTransfer.files)
    );
  };

  const handleRemove = (index: number) => {
    if (disabled) return;

    onChange(
      value.filter((_, i) => i !== index)
    );

    setValidationError(null);
  };

  return (
    <Stack spacing={1.5}>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 600 }}
      >
        {label}
      </Typography>

      <Box
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={handleDrop}
        sx={{
          border: "2px dashed",
          borderColor:
            error || validationError
              ? "error.main"
              : dragging
                ? "primary.main"
                : "divider",
          borderRadius: 2,
          p: 3,
          textAlign: "center",
          bgcolor: dragging
            ? "action.hover"
            : "background.paper",
          opacity: disabled ? 0.5 : 1,
          transition: "background-color 0.2s",
          cursor: disabled ? "not-allowed" : "default",
        }}
      >
        <CloudUploadOutlined
          color="action"
          sx={{ fontSize: 44, mb: 1 }}
        />

        <Typography
          variant="body2"
          sx={{ mb: 1 }}
        >
          Drag and drop files here
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 2 }}
        >
          Maximum {maxSizeMB} MB per file
          {multiple
            ? ` • Up to ${maxFiles} files`
            : " • Single file"}
        </Typography>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          hidden
          onChange={handleInputChange}
        />

        <Button
          variant="outlined"
          size="small"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Browse Files
        </Button>
      </Box>

      {helperText && (
        <Typography
          variant="caption"
          color={
            error ? "error.main" : "text.secondary"
          }
        >
          {helperText}
        </Typography>
      )}

      {validationError && (
        <Alert
          severity="error"
          onClose={() => setValidationError(null)}
        >
          {validationError}
        </Alert>
      )}

      {value.length > 0 && (
        <Stack spacing={1}>
          {value.map((file, index) => (
            <FilePreview
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              file={file}
              disabled={disabled}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export default FormFileUpload;
