import React from 'react';
import { format } from 'date-fns';
import { Calendar } from '../components/Calendar';
import { Badge } from '../components/Badge';
import { CalendarWorkSchedule } from '../components/CalendarWorkSchedule';
import styles from './CalendarMonthView.module.css';
import type { Task } from '../helpers/TaskStorage';

interface CalendarMonthViewProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  getTasksForDay: (date: Date) => Task[];
  dateRange: {
    start: Date;
    end: Date;
  };
  onWorkScheduleClick: (date: Date, scheduleType: any) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  onDateSelect,
  getTasksForDay,
  dateRange,
  onWorkScheduleClick
}) => {
  // Define modifiers for the calendar
  const modifiers = React.useMemo(() => {
    // Create a map of dates to their task counts
    const taskModifiers: Record<string, Date[]> = {
      hasTasks: [],
      hasHighPriorityTasks: [],
      hasMediumPriorityTasks: [],
      hasLowPriorityTasks: []
    };
    
    // Populate the modifiers with dates from the date range
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    // Ensure we have valid dates
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const current = new Date(start);
      
      // Iterate through each day in the range
      while (current <= end) {
        const tasks = getTasksForDay(new Date(current));
        
        // Add to hasTasks modifier if there are any tasks
        if (tasks.length > 0) {
          taskModifiers.hasTasks.push(new Date(current));
          
          // You could also categorize by priority if the Task type has a priority field
          // This is just an example - adjust based on your actual Task structure
          const highPriorityTasks = tasks.filter(task => task.priority === 'high');
          const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium');
          const lowPriorityTasks = tasks.filter(task => task.priority === 'low');
          
          if (highPriorityTasks.length > 0) {
            taskModifiers.hasHighPriorityTasks.push(new Date(current));
          }
          
          if (mediumPriorityTasks.length > 0) {
            taskModifiers.hasMediumPriorityTasks.push(new Date(current));
          }
          
          if (lowPriorityTasks.length > 0) {
            taskModifiers.hasLowPriorityTasks.push(new Date(current));
          }
        }
        
        // Move to the next day
        current.setDate(current.getDate() + 1);
      }
    }
    
    return taskModifiers;
  }, [dateRange, getTasksForDay]);

  return (
    <div className={styles.monthView}>
      <Calendar
        mode="single"
        selected={currentDate}
        onSelect={(date) => date && onDateSelect(date)}
        className={styles.monthCalendar}
        showOutsideDays={true}
        fixedWeeks={true}
        data-testid="month-calendar"
        modifiers={{
          ...modifiers,
          today: [new Date()] // Add today modifier
        }}
        modifiersClassNames={{
          hasTasks: styles.hasTasksCell,
          hasHighPriorityTasks: styles.hasHighPriorityTasksCell,
          hasMediumPriorityTasks: styles.hasMediumPriorityTasksCell,
          hasLowPriorityTasks: styles.hasLowPriorityTasksCell,
          today: styles.todayCell
        }}
      />
    </div>
  );
};