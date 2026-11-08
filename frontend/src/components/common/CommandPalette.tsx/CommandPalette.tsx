
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";

import {
  SearchOutlined,
  KeyboardReturnOutlined,
} from "@mui/icons-material";

export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  group?: string;
  keywords?: string[];
  shortcut?: string;
  enabled?: boolean;
  roles?: string[];
  onSelect: () => void | Promise<void>;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandPaletteItem[];
  userRole?: string;
  placeholder?: string;
  title?: string;
}

export default function CommandPalette({
  open,
  onClose,
  commands,
  userRole,
  placeholder = "Search commands...",
  title = "Command Palette",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] =
    useState(0);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = useMemo(() => {
    const search = query.trim().toLowerCase();

    return commands.filter((command) => {
      if (
        command.roles?.length &&
        (!userRole ||
          !command.roles.includes(userRole))
      ) {
        return false;
      }

      if (!search) return true;

      return [
        command.label,
        command.description ?? "",
        command.group ?? "",
        ...(command.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [commands, query, userRole]);

  const activeIndex =
    filteredCommands.length === 0
      ? -1
      : Math.min(
          selectedIndex,
          filteredCommands.length - 1
        );

  const executeCommand = async (
    command: CommandPaletteItem
  ) => {
    if (command.enabled === false) return;

    setError("");

    try {
      await command.onSelect();
      onClose();
    } catch {
      setError("Unable to execute this command.");
    }
  };

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  const handleKeyDown = (
    event: React.KeyboardEvent
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setSelectedIndex((previous) =>
        Math.min(
          previous + 1,
          filteredCommands.length - 1
        )
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setSelectedIndex((previous) =>
        Math.max(previous - 1, 0)
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const command =
        filteredCommands[activeIndex];

      if (command) {
        void executeCommand(command);
      }
    }
  };

  const groupedCommands = Array.from(
    new Set(
      filteredCommands.map(
        (command) => command.group ?? "General"
      )
    )
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="command-palette-title"
    >
      <Box sx={{ px: 2, pt: 2 }}>
        <Typography
          id="command-palette-title"
          variant="h6"
          sx={{ fontWeight: 700, mb: 2 }}
        >
          {title}
        </Typography>

        <TextField
          inputRef={inputRef}
          fullWidth
          autoFocus
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedIndex(0);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <DialogContent
        sx={{
          px: 1,
          maxHeight: 400,
          overflowY: "auto",
        }}
      >
        {error && (
          <Typography
            color="error"
            variant="body2"
            sx={{ px: 2, mb: 2 }}
          >
            {error}
          </Typography>
        )}

        {filteredCommands.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
            py: 4,
            textAlign: "center",
            }}
          >
            No matching commands found.
          </Typography>
        )}

        {groupedCommands.map((group) => (
          <Box key={group}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ px: 2 }}
            >
              {group}
            </Typography>

            <List dense disablePadding>
              {filteredCommands.map(
                (command, index) => {
                  if (
                    (command.group ?? "General") !==
                    group
                  ) {
                    return null;
                  }

                  return (
                    <ListItemButton
                      key={command.id}
                      selected={index === activeIndex}
                      disabled={
                        command.enabled === false
                      }
                      onMouseEnter={() =>
                        setSelectedIndex(index)
                      }
                      onClick={() => {
                        void executeCommand(command);
                      }}
                      sx={{ borderRadius: 1, mx: 1 }}
                    >
                      <ListItemText
                        primary={command.label}
                        secondary={
                          command.description
                        }
                      />

                      {command.shortcut && (
                        <Chip
                          label={command.shortcut}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </ListItemButton>
                  );
                }
              )}
            </List>

            <Divider sx={{ my: 1 }} />
          </Box>
        ))}
      </DialogContent>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <KeyboardReturnOutlined
          fontSize="small"
          color="action"
        />

        <Typography
          variant="caption"
          color="text.secondary"
        >
          Enter to select · ↑↓ to navigate ·
          Esc to close
        </Typography>
      </Box>
    </Dialog>
  );
}
