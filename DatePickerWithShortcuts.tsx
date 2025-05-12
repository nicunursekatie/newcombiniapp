import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, addWeeks, isEqual, addMonths } from 'date-fns';
import { Calendar } from './Calendar';
import { Button } from './Button';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { CalendarIcon, X, HelpCircle } from 'lucide-react';
import { useWorkScheduleModifiers } from '../helpers/useWorkScheduleModifiers';
import styles from './DatePickerWithShortcuts.module.css';

export type DateShortcut = 'today' | 'tomorrow' | 'nextWeek';

export interface DatePickerWithShortcutsProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  clearable?: boolean;
  showShortcuts?: DateShortcut[] | boolean;
  showWorkSchedule?: boolean;
}

export const DatePickerWithShortcuts = ({
  value,
  onChange,
  className = '',
  disabled = false,
  placeholder = 'Select date',
  clearable = true,
  showShortcuts = true,
  showWorkSchedule = false,
}: DatePickerWithShortcutsProps) => {
  const [date, setDate] = useState<Date | undefined>(value);
  const [open, setOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  
  // Calculate date range for work schedule (current month + next month)
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = addMonths(startDate, 1);
  
  // Get work schedule modifiers if enabled
  const { modifiers, isLoading } = showWorkSchedule 
    ? useWorkScheduleModifiers(startDate, endDate)
    : { modifiers: { fullDaySchedule: [], morningSchedule: [], afternoonSchedule: [] }, isLoading: false };

  // Update internal state when value prop changes
  useEffect(() => {
    setDate(value);
  }, [value]);

  // Determine which shortcuts to show
  const shortcuts: DateShortcut[] = typeof showShortcuts === 'boolean'
    ? (showShortcuts ? ['today', 'tomorrow', 'nextWeek'] : [])
    : showShortcuts;

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    onChange(newDate);
    if (newDate) setOpen(false);
  };

  const handleShortcutSelect = (shortcut: DateShortcut) => {
    let newDate: Date;
    const today = new Date();
    
    switch (shortcut) {
      case 'today':
        newDate = today;
        break;
      case 'tomorrow':
        newDate = addDays(today, 1);
        break;
      case 'nextWeek':
        // Set to next Monday
        const nextMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
        newDate = nextMonday;
        break;
      default:
        return;
    }
    
    handleDateSelect(newDate);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDateSelect(undefined);
  };

  const formatDate = (date?: Date) => {
    if (!date) return placeholder;
    return format(date, 'MMM d, yyyy');
  };

  const isShortcutActive = (shortcut: DateShortcut) => {
    if (!date) return false;
    
    const today = new Date();
    
    switch (shortcut) {
      case 'today':
        return isEqual(
          new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          new Date(today.getFullYear(), today.getMonth(), today.getDate())
        );
      case 'tomorrow':
        const tomorrow = addDays(today, 1);
        return isEqual(
          new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
        );
      case 'nextWeek':
        const nextMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
        return isEqual(
          new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate())
        );
      default:
        return false;
    }
  };

  const shortcutLabels: Record<DateShortcut, string> = {
    today: 'Today',
    tomorrow: 'Tomorrow',
    nextWeek: 'Next Week'
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={styles.dateButton}
            disabled={disabled}
            type="button"
          >
            <CalendarIcon size={16} className={styles.calendarIcon} />
            <span className={styles.dateText}>
              {formatDate(date)}
            </span>
            {date && clearable && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={styles.clearButton}
                onClick={handleClear}
                aria-label="Clear date"
              >
                <X size={14} />
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={styles.popoverContent}>
          {shortcuts.length > 0 && (
            <div className={styles.shortcuts}>
              {shortcuts.map((shortcut) => (
                <Button
                  key={shortcut}
                  size="sm"
                  variant={isShortcutActive(shortcut) ? "primary" : "outline"}
                  className={styles.shortcutButton}
                  onClick={() => handleShortcutSelect(shortcut)}
                >
                  {shortcutLabels[shortcut]}
                </Button>
              ))}
            </div>
          )}
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            className={styles.calendar}
            modifiers={showWorkSchedule ? modifiers : undefined}
          />
          {showWorkSchedule && (
            <div className={styles.scheduleInfo}>
              <div className={styles.legendToggle}>
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={() => setShowLegend(!showLegend)}
                  aria-label="Show work schedule legend"
                >
                  <HelpCircle size={16} />
                </Button>
                <span>Work Schedule</span>
              </div>
              {showLegend && (
                <div className={styles.legend}>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.fullDay}`}></div>
                    <span>Full Day</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.morning}`}></div>
                    <span>Morning</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.afternoon}`}></div>
                    <span>Afternoon</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};