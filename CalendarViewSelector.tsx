import React from 'react';
import { ToggleGroup, ToggleGroupItem } from './ToggleGroup';
import styles from './CalendarViewSelector.module.css';

export type CalendarView = 'month' | 'week' | 'day';

interface CalendarViewSelectorProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  className?: string;
}

export const CalendarViewSelector: React.FC<CalendarViewSelectorProps> = ({
  view,
  onViewChange,
  className = '',
}) => {
  return (
    <ToggleGroup 
      type="single" 
      value={view} 
      onValueChange={(value) => value && onViewChange(value as CalendarView)}
      className={`${styles.viewSelector} ${className}`}
    >
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
    </ToggleGroup>
  );
};