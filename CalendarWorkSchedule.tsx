import React, { useMemo } from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { WorkDay, ScheduleType } from "../helpers/useWorkSchedule";
import { useWorkScheduleModifiers } from "../helpers/useWorkScheduleModifiers";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Tooltip";
import styles from "./CalendarWorkSchedule.module.css";

export type { ScheduleType } from "../helpers/useWorkSchedule";

export interface CalendarWorkScheduleProps {
  date: Date;
  view?: 'month' | 'week' | 'day';
  className?: string;
  compact?: boolean;
  onClick?: (date: Date, scheduleType: ScheduleType) => void;
  dateRange?: { start: Date; end: Date };
}

export const CalendarWorkSchedule: React.FC<CalendarWorkScheduleProps> = ({
  date,
  view = 'month',
  className = '',
  compact = false,
  onClick,
  dateRange,
}) => {
  // Use the start and end dates from dateRange prop if provided, otherwise use the single date
  const start = dateRange?.start || date;
  const end = dateRange?.end || date;
  
  // Use the useWorkScheduleModifiers hook to get schedule data
  const { modifiers } = useWorkScheduleModifiers(start, end);
  
  // Helper to format time range for display - memoized to avoid recreating on each render
  const formatTimeRange = useMemo(() => {
    return (startTime: string, endTime: string): string => {
      try {
        return `${format(new Date(`2000-01-01T${startTime}`), 'h:mm a')} - ${format(new Date(`2000-01-01T${endTime}`), 'h:mm a')}`;
      } catch (error) {
        return `${startTime} - ${endTime}`;
      }
    };
  }, []);

  // Use memo to cache the work day determination
  const workDay = useMemo<WorkDay | null>(() => {
    // Check if this date is in any of the schedule types
    const isFullDay = modifiers.fullDaySchedule.some(d => 
      d.getFullYear() === date.getFullYear() && 
      d.getMonth() === date.getMonth() && 
      d.getDate() === date.getDate()
    );
    
    const isMorning = modifiers.morningSchedule.some(d => 
      d.getFullYear() === date.getFullYear() && 
      d.getMonth() === date.getMonth() && 
      d.getDate() === date.getDate()
    ) && !isFullDay;
    
    const isAfternoon = modifiers.afternoonSchedule.some(d => 
      d.getFullYear() === date.getFullYear() && 
      d.getMonth() === date.getMonth() && 
      d.getDate() === date.getDate()
    ) && !isFullDay;
    
    // Determine the schedule type and create a WorkDay object
    if (isFullDay) {
      return {
        date: new Date(date),
        type: 'full' as const,
        startTime: '07:00',
        endTime: '19:00'
      };
    } else if (isMorning) {
      return {
        date: new Date(date),
        type: 'morning' as const,
        startTime: '07:00',
        endTime: '13:00'
      };
    } else if (isAfternoon) {
      return {
        date: new Date(date),
        type: 'afternoon' as const,
        startTime: '13:00',
        endTime: '19:00'
      };
    } else {
      return null;
    }
  }, [date, modifiers]);

  // Handle click events - memoized to avoid recreating on each render
  const handleClick = useMemo(() => {
    return (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent calendar cell click
      if (onClick && workDay) {
        onClick(date, workDay.type);
      }
    };
  }, [date, onClick, workDay]);

  // Render content based on view type - memoized to avoid recreating on each render
  const content = useMemo(() => {
    if (!workDay) return null;
    
    const scheduleTypeClass = styles[workDay.type as keyof typeof styles];
    
    if (view === 'month') {
      return compact ? (
        <div 
          className={`${styles.monthCompactIndicator} ${scheduleTypeClass}`}
          data-schedule-type={workDay.type}
          onClick={handleClick}
          title={`${workDay.type === 'full' ? 'Full Day' : workDay.type === 'morning' ? 'Morning' : 'Afternoon'} Schedule`}
        >
          <Clock size={10} className={styles.icon} />
        </div>
      ) : (
        <div 
          className={`${styles.monthIndicator} ${scheduleTypeClass}`}
          data-schedule-type={workDay.type}
          onClick={handleClick}
          title={`${workDay.type === 'full' ? 'Full Day' : workDay.type === 'morning' ? 'Morning' : 'Afternoon'} Schedule`}
        >
          <Clock size={14} className={styles.icon} />
        </div>
      );
    }
    
    if (view === 'week') {
      return (
        <div 
          className={`${styles.weekIndicator} ${scheduleTypeClass}`}
          data-schedule-type={workDay.type}
          onClick={handleClick}
        >
          <Clock size={14} className={styles.icon} />
          <span className={styles.label}>
            {workDay.type === 'full' ? 'Full' : 
             workDay.type === 'morning' ? 'AM' : 
             'PM'}
          </span>
        </div>
      );
    }
    
    // Day view
    return (
      <div 
        className={`${styles.dayIndicator} ${scheduleTypeClass}`}
        data-schedule-type={workDay.type}
        onClick={handleClick}
      >
        <div className={styles.dayHeader}>
          <Clock size={16} className={styles.icon} />
          <span className={styles.title}>
            {workDay.type === 'full' ? 'Full Day' : 
             workDay.type === 'morning' ? 'Morning' : 
             'Afternoon'}
          </span>
        </div>
        <div className={styles.timeRange}>
          {formatTimeRange(workDay.startTime, workDay.endTime)}
        </div>
      </div>
    );
  }, [view, compact, workDay, handleClick, formatTimeRange]);

  // Tooltip content based on schedule type - memoized to avoid recreating on each render
  const tooltipContent = useMemo(() => {
    if (!workDay) return null;
    
    return (
      <div className={styles.tooltipContent}>
        <div className={styles.tooltipHeader}>
          <Clock size={14} className={styles.tooltipIcon} />
          <span className={styles.tooltipTitle}>
            {workDay.type === 'full' ? 'Full Day Schedule' : 
             workDay.type === 'morning' ? 'Morning Schedule' : 
             'Afternoon Schedule'}
          </span>
        </div>
        <div className={styles.tooltipTime}>
          {formatTimeRange(workDay.startTime, workDay.endTime)}
        </div>
        <div className={styles.tooltipDate}>
          {format(date, 'EEEE, MMMM d, yyyy')}
        </div>
      </div>
    );
  }, [workDay, formatTimeRange, date]);

  if (!workDay) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${styles.container} ${className}`}>
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};