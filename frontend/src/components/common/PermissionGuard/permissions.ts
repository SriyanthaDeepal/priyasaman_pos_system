
export type PermissionMatchMode = "all" | "any";

export interface PermissionCheckOptions {
  permissions: readonly string[];
  requiredPermissions?: readonly string[];
  role?: string | null;
  allowedRoles?: readonly string[];
  match?: PermissionMatchMode;
}

/**
 * Checks whether a user satisfies the required
 * role and permission restrictions.
 *
 * - "all": User must have every required permission.
 * - "any": User must have at least one required permission.
 * - If no permissions are required, only role restrictions apply.
 * - No wildcard or implicit administrator bypass.
 */
export function hasPermission({
  permissions,
  requiredPermissions = [],
  role = null,
  allowedRoles = [],
  match = "all",
}: PermissionCheckOptions): boolean {
  // Check role restrictions.
  const roleAllowed =
    allowedRoles.length === 0 ||
    (role !== null && allowedRoles.includes(role));

  if (!roleAllowed) {
    return false;
  }

  // No permission restriction.
  if (requiredPermissions.length === 0) {
    return true;
  }

  const grantedPermissions = new Set(permissions);

  if (match === "any") {
    return requiredPermissions.some((permission) =>
      grantedPermissions.has(permission)
    );
  }

  return requiredPermissions.every((permission) =>
    grantedPermissions.has(permission)
  );
}
