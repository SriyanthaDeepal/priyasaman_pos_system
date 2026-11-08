import { Chip } from '@mui/material';

export type StatusType =
  | 'active'
  | 'inactive'
  | 'expired'
  | 'damaged'
  | 'instock'
  | 'lowstock'
  | 'outofstock'
  | 'paid'
  | 'pending'
  | 'cancelled'
  | 'synced'
  | 'notsynced'
  | 'failed';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

function StatusBadge({ status, label }: StatusBadgeProps) {
  // Maps all StatusType values to custom labels and standard MUI Chip colors
  const statusConfig: Record<StatusType, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
    // Green (Safe / Positive States)
    active: { label: 'Active', color: 'success' as const },
    instock: { label: 'In Stock', color: 'success' as const },
    paid: { label: 'Paid', color: 'success' as const },
    synced: { label: 'Synced', color: 'success' as const },

    // Yellow / Orange (Middle Risk / Mid-State)
    lowstock: { label: 'Low Stock', color: 'warning' as const },
    pending: { label: 'Pending', color: 'warning' as const },
    notsynced: {label: 'Not Synced', color: 'warning' as const},

    // Red (Critical / Negative / Final Stop States)
    inactive: { label: 'Inactive', color: 'error' as const },
    expired: { label: 'Expired', color: 'error' as const },
    damaged: { label: 'Damaged', color: 'error' as const },
    outofstock: { label: 'Out of Stock', color: 'error' as const },
    cancelled: { label: 'Cancelled', color: 'error' as const },
    failed: { label: 'Failed', color: 'error' as const },
  };

  const config = statusConfig[status];

  return (
    <Chip 
      label={label ?? config.label} 
      color={config.color} 
      size="small" 
    />
  );
}

export default StatusBadge;