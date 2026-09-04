"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateOfBirth, parseISODate, toISODate } from "@/lib/customer/profile";
import { cn } from "@/lib/utils";

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = "Pick a date",
  disabled,
}: {
  id?: string;
  value: string | null;
  onChange: (next: string | null) => void;
  min?: Date;
  max?: Date;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = (value ? parseISODate(value) : undefined) ?? undefined;
  const defaultMonth = selected ?? max ?? min;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-cream px-3 text-left text-[13px] text-foreground outline-none transition-[border-color] duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:border-line-strong focus-visible:border-clay disabled:opacity-45",
            !selected && "text-ink-faint",
          )}
        >
          <span>{selected && value ? formatDateOfBirth(value) : placeholder}</span>
          <CalendarIcon size={15} strokeWidth={1.5} className="text-ink-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selected}
          defaultMonth={defaultMonth}
          startMonth={min}
          endMonth={max}
          disabled={[
            ...(min ? [{ before: min }] : []),
            ...(max ? [{ after: max }] : []),
          ]}
          onSelect={(next) => {
            onChange(next ? toISODate(next) : null);
            if (next) setOpen(false);
          }}
        />
        {value && (
          <div className="border-t border-line px-3 py-2">
            <button
              type="button"
              className="text-[12px] text-ink-muted underline decoration-line-strong underline-offset-2 hover:text-ink"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear date
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
