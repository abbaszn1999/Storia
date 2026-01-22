import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, XCircle, Loader2, Eye, Pause } from "lucide-react";
import type { CampaignStatus, ItemStatus } from "../../types";

interface StatusBadgeProps {
  status: CampaignStatus | ItemStatus;
  className?: string;
}

const statusConfig: Record<string, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon?: any;
  className?: string;
}> = {
  // Campaign statuses
  draft: {
    label: "Draft",
    variant: "secondary",
    icon: Clock,
  },
  generating: {
    label: "Generating",
    variant: "default",
    icon: Loader2,
    className: "animate-pulse",
  },
  review: {
    label: "Review",
    variant: "outline",
    icon: Eye,
  },
  in_progress: {
    label: "In Progress",
    variant: "default",
    icon: Loader2,
  },
  paused: {
    label: "Paused",
    variant: "secondary",
    icon: Pause,
  },
  completed: {
    label: "Completed",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    variant: "secondary",
    icon: XCircle,
  },
  
  // Item statuses
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
  },
  generated: {
    label: "Generated",
    variant: "default",
    icon: CheckCircle2,
  },
  review_required: {
    label: "Review Required",
    variant: "outline",
    icon: Eye,
  },
  approved: {
    label: "Approved",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: XCircle,
  },
  in_production: {
    label: "In Production",
    variant: "default",
    icon: Loader2,
  },
  rendering: {
    label: "Rendering",
    variant: "default",
    icon: Loader2,
    className: "animate-pulse",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: AlertCircle,
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className || ''} ${className || ''}`}
    >
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
