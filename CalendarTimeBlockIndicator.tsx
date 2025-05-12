import React from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import styles from './CalendarTimeBlockIndicator.module.css';
import type { Task } from '../helpers/TaskStorage';

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  taskId?: string | null;
}

interface CalendarTimeBlockIndicatorProps {
  timeBlock: TimeBlock;
  view: 'month' | 'week' | 'day';
  linkedTask?: Task | null;
  onClick?: (timeBlockId: string) => void;
  className?: string;
}

export const CalendarTimeBlockIndicator: React.FC<CalendarTimeBlockIndicatorProps> = ({
  timeBlock,
  view,
  linkedTask,
  onClick,
  className = '',
}) => {
  const handleClick = () => {
    if (onClick) onClick(timeBlock.id);
  };

  // Format time range for display
  const formatTimeRange = () => {
    try {
      return `${format(new Date(`2000-01-01T${timeBlock.startTime}`), 'h:mm a')} - ${format(new Date(`2000-01-01T${timeBlock.endTime}`), 'h:mm a')}`;
    } catch (error) {
      console.warn('Error formatting time range:', error);
      return `${timeBlock.startTime} - ${timeBlock.endTime}`;
    }
  };

  return (
    <div 
      className={`${styles.timeBlockIndicator} ${styles[view]} ${className}`}
      onClick={handleClick}
      data-testid={`time-block-indicator-${timeBlock.id}`}
    >
      <div className={styles.timeBlockContent}>
        {/* Show clock icon in week and day views */}
        {view !== 'month' && (
          <Clock size={view === 'day' ? 14 : 12} className={styles.clockIcon} />
        )}
        
        <div className={styles.timeBlockInfo}>
          <div className={styles.timeBlockTitle}>
            {timeBlock.title}
          </div>
          
          {/* Show time range in week and day views */}
          {view !== 'month' && (
            <div className={styles.timeRange}>
              {formatTimeRange()}
            </div>
          )}
          
          {/* Show linked task in day view */}
          {view === 'day' && linkedTask && (
            <div className={styles.linkedTask}>
              <span className={styles.linkedTaskLabel}>Task: </span>
              <span className={`${styles.linkedTaskTitle} ${linkedTask.completed ? styles.completed : ''}`}>
                {linkedTask.title}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};