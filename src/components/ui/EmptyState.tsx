import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-cream/50 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-sand text-ink-faint">
          {icon}
        </span>
      )}
      <h3 className="text-base">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
