import * as React from 'react';
import { isValid } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

import { DateTimePicker as HuyDateTimePicker } from '@/components/ui/huy-datetime-picker';
import { cn } from '@/lib/utils';
import { useI18n } from '@/shared/i18n';

interface DateTimePickerProps {
  value: string;
  onChange: (isoString: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  modal?: boolean;
}

const DEFAULT_PLACEHOLDER_ZH = '选择日期时间';
const DEFAULT_PLACEHOLDER_EN = 'Pick a date and time';

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  id: _id,
  disabled,
  className,
  modal = false,
}: DateTimePickerProps): React.ReactNode {
  const { locale } = useI18n();
  const isZh = locale.startsWith('zh');

  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    const date = new Date(value);
    return isValid(date) ? date : undefined;
  }, [value]);

  const textPack = React.useMemo(
    () =>
      isZh
        ? {
            pickDateTime: '选择日期时间',
            clearDate: '清空日期',
            done: '完成',
            timezone: '时区',
          }
        : {
            pickDateTime: 'Pick a date and time',
            clearDate: 'Clear date',
            done: 'Done',
            timezone: 'Timezone',
          },
    [isZh]
  );

  return (
    <HuyDateTimePicker
      modal={modal}
      value={dateValue}
      clearable
      disabled={disabled}
      placeholder={placeholder || (isZh ? DEFAULT_PLACEHOLDER_ZH : DEFAULT_PLACEHOLDER_EN)}
      texts={textPack}
      locale={isZh ? zhCN : enUS}
      onChange={(nextDate) => onChange(nextDate ? nextDate.toISOString() : '')}
      use12HourFormat={false}
      timePicker={{ hour: true, minute: true, second: false }}
      classNames={{
        trigger: cn('h-10 rounded-lg border-border/80 text-sm', className),
      }}
    />
  );
}
