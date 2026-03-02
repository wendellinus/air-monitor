/**
 * DateTimePicker — Popover + Calendar + time Input
 * 使用 shadcn Popover + Calendar 实现日期时间选择，替代原生 datetime-local 控件
 */
import * as React from 'react';
import { format, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  /** ISO string value */
  value: string;
  onChange: (isoString: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = '选择日期时间',
  id,
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse the current string value into a Date
  const currentDate = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return isValid(d) ? d : undefined;
  }, [value]);

  // Time as "HH:MM" string (editable)
  const [timeStr, setTimeStr] = React.useState<string>(() => {
    if (!currentDate) return '00:00';
    return format(currentDate, 'HH:mm');
  });

  // When user picks a day on the calendar
  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    const [hours, minutes] = parseTime(timeStr);
    const combined = new Date(day);
    combined.setHours(hours, minutes, 0, 0);
    onChange(combined.toISOString());
    setOpen(false);
  }

  // When user edits the time input
  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const t = e.target.value;
    setTimeStr(t);
    if (currentDate) {
      const [hours, minutes] = parseTime(t);
      const combined = new Date(currentDate);
      combined.setHours(hours, minutes, 0, 0);
      onChange(combined.toISOString());
    }
  }

  const displayLabel = currentDate
    ? `${format(currentDate, 'yyyy-MM-dd')}  ${timeStr}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !currentDate && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
          <span className="truncate">{displayLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={currentDate} onSelect={handleDaySelect} initialFocus />
        {/* Time row */}
        <div className="flex items-center gap-2 border-t px-3 py-2">
          <span className="text-xs text-muted-foreground">时间</span>
          <Input
            type="time"
            value={timeStr}
            onChange={handleTimeChange}
            className="h-8 w-[110px] text-sm"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function parseTime(t: string): [number, number] {
  const parts = t.split(':');
  const hours = Math.min(23, Math.max(0, parseInt(parts[0] ?? '0', 10)));
  const minutes = Math.min(59, Math.max(0, parseInt(parts[1] ?? '0', 10)));
  return [isNaN(hours) ? 0 : hours, isNaN(minutes) ? 0 : minutes];
}
