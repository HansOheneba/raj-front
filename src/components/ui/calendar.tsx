"use client";

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn("w-fit p-3 [--cell-size:2rem]", className)}
      classNames={{
        months: "relative flex flex-col",
        month: "flex w-full flex-col gap-3",
        month_caption: "flex h-8 w-full items-center justify-center px-8",
        caption_label: cn(
          "select-none text-[13px] font-medium",
          captionLayout !== "label" && "flex h-8 items-center gap-1 rounded-md px-2 text-ink [&>svg]:size-3.5 [&>svg]:text-ink-muted",
        ),
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8 p-0 text-ink-muted hover:text-ink",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8 p-0 text-ink-muted hover:text-ink",
        ),
        dropdowns: "flex h-8 items-center justify-center gap-1.5 text-[13px] font-medium",
        dropdown_root: "relative rounded-md border border-input bg-cream has-focus:border-clay",
        dropdown: "absolute inset-0 cursor-pointer opacity-0",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex-1 select-none text-[11px] font-normal text-ink-muted",
        week: "mt-1 flex w-full",
        day: "group/day relative aspect-square size-8 p-0 text-center text-[13px]",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal hover:bg-sand",
        ),
        selected:
          "[&_button]:bg-clay [&_button]:text-cream [&_button]:hover:bg-clay-dark [&_button]:hover:text-cream",
        today: "[&_button]:bg-clay-soft [&_button]:text-clay-dark",
        outside: "text-ink-faint",
        disabled: "text-ink-faint opacity-45",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4", chevronClassName)} {...chevronProps} />;
          }
          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-4", chevronClassName)} {...chevronProps} />;
          }
          return <ChevronDownIcon className={cn("size-4", chevronClassName)} {...chevronProps} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
