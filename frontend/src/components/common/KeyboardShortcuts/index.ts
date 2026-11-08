
import { useEffect } from "react";

export {
  KeyboardShortcutsDialog,
} from "./KeyboardShortcuts";

export type {
  KeyboardShortcutsDialogProps,
} from "./KeyboardShortcuts";

export interface KeyboardShortcut {
  id: string;
  keys: string;
  label: string;
  description?: string;
  group?: string;
  enabled?: boolean;
  allowInInputs?: boolean;
  preventDefault?: boolean;
  onTrigger: () => void;
}

export interface ShortcutConflict {
  keys: string;
  ids: string[];
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

const MODIFIER_ORDER = [
  "ctrl",
  "alt",
  "shift",
  "meta",
];

function normalizeShortcut(
  shortcut: string
): string {
  const aliases: Record<string, string> = {
    control: "ctrl",
    cmd: "meta",
    command: "meta",
    option: "alt",
    esc: "escape",
    return: "enter",
    space: " ",
    spacebar: " ",
  };

  const parts = shortcut
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .map((part) => aliases[part] ?? part);

  const modifiers = MODIFIER_ORDER.filter(
    (modifier) => parts.includes(modifier)
  );

  const keys = parts.filter(
    (part) => !MODIFIER_ORDER.includes(part)
  );

  return [...modifiers, ...keys].join("+");
}

function eventToShortcut(
  event: KeyboardEvent
): string {
  const modifiers: string[] = [];

  if (event.ctrlKey) modifiers.push("ctrl");
  if (event.altKey) modifiers.push("alt");
  if (event.shiftKey) modifiers.push("shift");
  if (event.metaKey) modifiers.push("meta");

  const key = event.key.toLowerCase();

  if (
    ["control", "alt", "shift", "meta"].includes(key)
  ) {
    return modifiers.join("+");
  }

  return normalizeShortcut(
    [...modifiers, key].join("+")
  );
}

function findShortcutConflicts(
  shortcuts: KeyboardShortcut[]
): ShortcutConflict[] {
  const groups = new Map<string, string[]>();

  shortcuts
    .filter((shortcut) => shortcut.enabled !== false)
    .forEach((shortcut) => {
      const key = normalizeShortcut(shortcut.keys);
      const ids = groups.get(key) ?? [];

      ids.push(shortcut.id);
      groups.set(key, ids);
    });

  return Array.from(groups.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([keys, ids]) => ({
      keys,
      ids,
    }));
}

function isEditableTarget(
  target: EventTarget | null
): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      "input, textarea, select, " +
      "[contenteditable], " +
      '[role="textbox"]'
    )
  );
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.repeat || event.isComposing) {
        return;
      }

      const pressed = eventToShortcut(event);

      const shortcut = shortcuts.find(
        (item) =>
          item.enabled !== false &&
          normalizeShortcut(item.keys) === pressed
      );

      if (!shortcut) return;

      if (
        !shortcut.allowInInputs &&
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }

      shortcut.onTrigger();
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [enabled, shortcuts]);

  return {
    conflicts: findShortcutConflicts(shortcuts),
  };
}
