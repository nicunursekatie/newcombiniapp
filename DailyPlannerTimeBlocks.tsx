import React, { useState, useEffect } from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { MoreVertical, Link as LinkIcon, Trash, Edit, X, Check, Clock, Briefcase } from 'lucide-react';
import { useWorkSchedule } from '../helpers/useWorkSchedule';
import { Button } from './Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './DropdownMenu';
import { LoadingSpinner } from './LoadingSpinner';
import { ExtendedTimeBlock } from './TimeBlockTypes';
import { Task, Project, Category } from '../helpers/TaskStorage';
import styles from './DailyPlannerTimeBlocks.module.css';

interface DailyPlannerTimeBlocksProps {
  timeBlocks: ExtendedTimeBlock[];
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  selectedDate: Date;
  isLoading: boolean;
  activeDragTask: string | null;
  onCreateBlock: () => void;
  onEditBlock: (block: ExtendedTimeBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onUnlinkTask: (block: ExtendedTimeBlock) => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onDrop: (e: React.DragEvent, blockId: string) => void;
  onUnlinkSpecificTask: (blockId: string, taskId: string) => void;
}

export const DailyPlannerTimeBlocks: React.FC<DailyPlannerTimeBlocksProps> = ({
  timeBlocks,
  tasks,
  projects,
  categories,
  selectedDate,
  isLoading,
  activeDragTask,
  onCreateBlock,
  onEditBlock,
  onDeleteBlock,
  onUnlinkTask,
  onTaskToggle,
  onDrop,
  onUnlinkSpecificTask
}) => {
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [workingHoursBlocks, setWorkingHoursBlocks] = useState<Record<string, boolean>>({});
  const { getSchedule } = useWorkSchedule();

  // Check if each time block is within working hours
  useEffect(() => {
    const checkWorkingHours = async () => {
      try {
        // Get the work schedule for the selected date
        const schedule = await getSchedule(selectedDate, selectedDate);
        
        if (schedule.length === 0) {
          // No work schedule for this day
          setWorkingHoursBlocks({});
          return;
        }
        
        const workDay = schedule[0];
        const { startTime, endTime } = workDay;
        
        // Check each time block if it falls within working hours
        const result: Record<string, boolean> = {};
        
        timeBlocks.forEach(block => {
          // Parse times to compare
          const blockStart = block.startTime;
          const blockEnd = block.endTime;
          
          // Simple string comparison works for 24h format times like "13:00"
          const isWithinWorkingHours = 
            (blockStart >= startTime && blockStart < endTime) || 
            (blockEnd > startTime && blockEnd <= endTime) ||
            (blockStart <= startTime && blockEnd >= endTime);
          
          result[block.id] = isWithinWorkingHours;
        });
        
        setWorkingHoursBlocks(result);
      } catch (error) {
        console.error('Error checking working hours:', error);
        setWorkingHoursBlocks({});
      }
    };
    
    if (timeBlocks.length > 0) {
      checkWorkingHours();
    }
  }, [timeBlocks, selectedDate, getSchedule]);

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    setDragOverBlockId(blockId);
  };

  const handleDragLeave = () => {
    setDragOverBlockId(null);
  };

  const handleDrop = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    setDragOverBlockId(null);
    onDrop(e, blockId);
  };

  const getTaskById = (taskId: string): Task | undefined => {
    return tasks.find(task => task.id === taskId);
  };

  const getProjectById = (projectId: string): Project | undefined => {
    return projects.find(project => project.id === projectId);
  };

  const getCategoryById = (categoryId: string): Category | undefined => {
    return categories.find(category => category.id === categoryId);
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    try {
      // Create date objects for today with the given times
      const today = format(selectedDate, 'yyyy-MM-dd');
      const startDate = parseISO(`${today}T${startTime}`);
      const endDate = parseISO(`${today}T${endTime}`);
      
      // Calculate the difference in minutes
      const diffMinutes = differenceInMinutes(endDate, startDate);
      
      // Format the duration
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      
      if (hours === 0) {
        return `${minutes}m`;
      } else if (minutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${minutes}m`;
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'Invalid time';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <p>Loading time blocks...</p>
      </div>
    );
  }

  if (timeBlocks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateContent}>
          <Clock size={48} className={styles.emptyStateIcon} />
          <h3>No time blocks for this day</h3>
          <p>Create time blocks to organize your day and link them to tasks.</p>
          <Button onClick={onCreateBlock}>Create Time Block</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.timeBlocksList}>
      {timeBlocks.map(block => {
        // Get linked task(s)
        let linkedTasks: Task[] = [];
        
        // Check for single taskId
        if (block.taskId) {
          const task = getTaskById(block.taskId);
          if (task) linkedTasks.push(task);
        }
        
        // Check for tasks array
        if (block.tasks && block.tasks.length > 0) {
          block.tasks.forEach(taskRef => {
            const task = getTaskById(taskRef.id);
            if (task && !linkedTasks.some(t => t.id === task.id)) {
              linkedTasks.push(task);
            }
          });
        }
        
        const duration = calculateDuration(block.startTime, block.endTime);
        const isDragOver = dragOverBlockId === block.id;
        
        return (
          <div 
            key={block.id}
            className={`${styles.timeBlock} ${isDragOver ? styles.dropTarget : ''} ${workingHoursBlocks[block.id] ? styles.workingHoursBlock : ''}`}
            onDragOver={(e) => handleDragOver(e, block.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, block.id)}
            data-testid={`time-block-${block.id}`}
          >
            <div className={styles.timeBlockHeader}>
              <div className={styles.timeBlockTime}>
                <span className={styles.startTime}>{block.startTime}</span>
                <span className={styles.timeBlockDivider}>-</span>
                <span className={styles.endTime}>{block.endTime}</span>
                <span className={styles.duration}>({duration})</span>
                {workingHoursBlocks[block.id] && (
                  <span className={styles.workingHoursIndicator} title="Within working hours">
                    <Briefcase size={14} />
                  </span>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className={styles.moreButton}>
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditBlock(block)}>
                    <Edit size={16} className={styles.dropdownIcon} />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteBlock(block.id)}>
                    <Trash size={16} className={styles.dropdownIcon} />
                    Delete
                  </DropdownMenuItem>
                  {linkedTasks.length > 0 && (
                    <DropdownMenuItem onClick={() => onUnlinkTask(block)}>
                      <X size={16} className={styles.dropdownIcon} />
                      Unlink All Tasks
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className={styles.timeBlockTitle}>
              {block.title}
            </div>
            
            {linkedTasks.length > 0 && (
              <div className={styles.linkedTasks}>
                <div className={styles.linkedTasksHeader}>
                  <LinkIcon size={14} className={styles.linkedTasksIcon} />
                  <span>Linked Tasks</span>
                </div>
                <div className={styles.linkedTasksList}>
                  {linkedTasks.map(task => {
                    const project = task.projectId ? getProjectById(task.projectId) : undefined;
                    const category = task.categoryId ? getCategoryById(task.categoryId) : undefined;
                    
                    return (
                      <div key={task.id} className={styles.linkedTask}>
                        <div className={styles.linkedTaskCheckbox}>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => onTaskToggle(task.id, e.target.checked)}
                            className={styles.taskCheckbox}
                          />
                        </div>
                        <div className={styles.linkedTaskContent}>
                          <div className={`${styles.linkedTaskTitle} ${task.completed ? styles.taskCompleted : ''}`}>
                            {task.title}
                          </div>
                          <div className={styles.linkedTaskMeta}>
                            {project && (
                              <span className={styles.linkedTaskProject}>
                                {project.title}
                              </span>
                            )}
                            {category && (
                              <span 
                                className={styles.linkedTaskCategory}
                                style={{ backgroundColor: category.color }}
                              >
                                {category.title}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          className={styles.unlinkButton}
                          onClick={() => onUnlinkSpecificTask(block.id, task.id)}
                          title="Unlink task"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {isDragOver && activeDragTask && (
              <div className={styles.dropIndicator}>
                <Check size={16} className={styles.dropIndicatorIcon} />
                <span>Drop to link task</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};