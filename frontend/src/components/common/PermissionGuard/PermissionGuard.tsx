
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import {
  Box,
  CircularProgress,
} from "@mui/material";

import { hasPermission } from "./permissions";

import type {
  PermissionMatchMode,
} from "./permissions";

// ============================================
// TYPES
// ============================================

export type PermissionGuardMode =
  | "hide"
  | "fallback"
  | "disable";

export interface PermissionContext {
  role?: string | null;
  permissions: readonly string[];
}

export interface PermissionGuardProps {
  children: ReactNode;

  permissions: readonly string[];
  requiredPermissions?: readonly string[];

  role?: string | null;
  allowedRoles?: readonly string[];

  match?: PermissionMatchMode;
  mode?: PermissionGuardMode;

  fallback?: ReactNode;

  loading?: boolean;
  loadingFallback?: ReactNode;
}

// ============================================
// COMPONENT
// ============================================

export default function PermissionGuard({
  children,
  permissions,
  requiredPermissions = [],
  role = null,
  allowedRoles = [],
  match = "all",
  mode = "hide",
  fallback = null,
  loading = false,
  loadingFallback,
}: PermissionGuardProps) {
  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    if (loadingFallback !== undefined) {
      return <>{loadingFallback}</>;
    }

    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          p: 1,
        }}
      >
        <CircularProgress size={20} />
      </Box>
    );
  }

  // ==========================================
  // PERMISSION VALIDATION
  // ==========================================

  const allowed = hasPermission({
    permissions,
    requiredPermissions,
    role,
    allowedRoles,
    match,
  });

  // ==========================================
  // ACCESS GRANTED
  // ==========================================

  if (allowed) {
    return <>{children}</>;
  }

  // ==========================================
  // ACCESS DENIED: FALLBACK MODE
  // ==========================================

  if (mode === "fallback") {
    return <>{fallback}</>;
  }

  // ==========================================
  // ACCESS DENIED: DISABLE MODE
  // ==========================================

  if (mode === "disable") {
    if (isValidElement(children)) {
      const child = children as ReactElement<{
        disabled?: boolean;
      }>;

      return cloneElement(child, {
        disabled: true,
      });
    }

    // Multiple children cannot be safely
    // disabled using cloneElement.
    return <>{fallback}</>;
  }

  // ==========================================
  // ACCESS DENIED: HIDE MODE
  // ==========================================

  return null;
}
