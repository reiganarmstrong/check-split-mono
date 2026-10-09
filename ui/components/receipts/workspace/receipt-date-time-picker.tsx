"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { requiredHighlightSoftStyle } from "./lib/constants";

const hourOptions = Array.from({ length: 12 }, (_, index) =>
  String(index + 1),
);
const minuteOptions = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
}

function getTimeParts(value: string) {
  const [hourValue = "0", minuteValue = "00"] = value.split(":");
  const parsedHour = Number.parseInt(hourValue, 10);
  const hour24 = Number.isFinite(parsedHour) ? parsedHour : 0;

  return {
    hour: String(hour24 % 12 || 12),
    minute: minuteOptions.includes(minuteValue) ? minuteValue : "00",
    period: hour24 >= 12 ? "PM" : "AM",
  } as const;
}

export function ReceiptDateTimePicker({
  value,
  invalid,
  onChange,
}: {
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [receiptDate = "", receiptTime = ""] = value.split("T");
  const selectedDate = parseLocalDate(receiptDate);
  const timeParts = getTimeParts(receiptTime);
  const requiredStyle = invalid ? requiredHighlightSoftStyle : undefined;

  function updateTime({
    hour = timeParts.hour,
    minute = timeParts.minute,
    period = timeParts.period,
  }: {
    hour?: string;
    minute?: string;
    period?: "AM" | "PM";
  }) {
    if (!receiptDate) {
      return;
    }

    const hour12 = Number.parseInt(hour, 10);
    const hour24 = (hour12 % 12) + (period === "PM" ? 12 : 0);
    onChange(`${receiptDate}T${String(hour24).padStart(2, "0")}:${minute}`);
  }

  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
      <div className="min-w-0 space-y-1.5">
        <Label
          htmlFor="receipt-occurred-date"
          className="text-xs text-[var(--muted-foreground)]"
        >
          Date
        </Label>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              id="receipt-occurred-date"
              type="button"
              variant="outline"
              aria-invalid={invalid}
              className="h-12 w-full min-w-0 justify-between overflow-hidden rounded-[0.8rem] border-[var(--line)] bg-[var(--panel-strong)] px-4 text-left text-base font-medium shadow-none hover:bg-[var(--panel-strong)]"
              style={requiredStyle}
            >
              <span className="truncate">
                {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Choose date"}
              </span>
              <CalendarDays className="size-4 shrink-0 text-[var(--muted-foreground)]" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto max-w-[calc(100vw-2rem)] rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] p-0"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate}
              onSelect={(nextDate) => {
                if (!nextDate) {
                  return;
                }

                onChange(
                  `${format(nextDate, "yyyy-MM-dd")}T${receiptTime || "00:00"}`,
                );
                setDatePickerOpen(false);
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div
        className="min-w-0 space-y-1.5"
        role="group"
        aria-labelledby="receipt-occurred-time-label"
      >
        <Label
          id="receipt-occurred-time-label"
          className="text-xs text-[var(--muted-foreground)]"
        >
          Time
        </Label>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)] gap-1.5">
          <Select
            value={timeParts.hour}
            disabled={!receiptDate}
            onValueChange={(hour) => updateTime({ hour })}
          >
            <SelectTrigger
              aria-label="Hour"
              aria-invalid={invalid}
              className="h-12 w-full min-w-0 rounded-[0.8rem] border-[var(--line)] bg-[var(--panel-strong)] px-2 text-base font-medium shadow-none"
              style={requiredStyle}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {hourOptions.map((hour) => (
                <SelectItem key={hour} value={hour}>
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={timeParts.minute}
            disabled={!receiptDate}
            onValueChange={(minute) => updateTime({ minute })}
          >
            <SelectTrigger
              aria-label="Minute"
              aria-invalid={invalid}
              className="h-12 w-full min-w-0 rounded-[0.8rem] border-[var(--line)] bg-[var(--panel-strong)] px-2 text-base font-medium shadow-none"
              style={requiredStyle}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {minuteOptions.map((minute) => (
                <SelectItem key={minute} value={minute}>
                  {minute}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={timeParts.period}
            disabled={!receiptDate}
            onValueChange={(period) =>
              updateTime({ period: period as "AM" | "PM" })
            }
          >
            <SelectTrigger
              aria-label="AM or PM"
              aria-invalid={invalid}
              className="h-12 w-full min-w-0 rounded-[0.8rem] border-[var(--line)] bg-[var(--panel-strong)] px-2 text-base font-medium shadow-none"
              style={requiredStyle}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
