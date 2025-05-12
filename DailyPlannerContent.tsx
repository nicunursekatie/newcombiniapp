import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../components/Button';
import { EditTimeBlockModal } from '../components/EditTimeBlockModal';
import { SonnerToaster } from '../components/SonnerToaster';
import { useTimeBlocks } from '../helpers/useTimeBlocks';
import { useTaskDatabase } from '../helpers/useTaskDatabase';
import { useWorkSchedule, ScheduleType } from '../helpers/useWorkSchedule';
import { format, parse, isToday, addDays, subDays, parseISO, isSameDay } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TaskSidebar } from '../components/TaskSidebar';
import { QuickCreateTask } from '../components/QuickCreateTask';
import { DailyPlannerTimeBlocks } from '../components/DailyPlannerTimeBlocks';
import { toast } from 'sonner';
import styles from '../pages/daily-planner.module.css';
import { ExtendedTimeBlock } from '../components/TimeBlockTypes';

export const DailyPlannerContent: React.FC = () => {
  const safeInitialDate = useMemo(() => {
    try {
      return new Date();
    } catch (error) {
      console.error('Error creating initial date:', error);
      return new Date(0);
    }
  }, []);
  
  const [selectedDate, setSelectedDate] = useState<Date>(safeInitialDate);
  const [editingBlock, setEditingBlock] = useState<ExtendedTimeBlock | null>(null);
  const [dateInputValue, setDateInputValue] = useState<string>(() => {
    try {
      return format(safeInitialDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error formatting initial date:', error);
      return '2023-01-01';
    }
  });
  const [activeDragTask, setActiveDragTask] = useState<string | null>(null);
  const [workSchedule, setWorkSchedule] = useState<{ type: ScheduleType; startTime: string; endTime: string } | null>(null);
  
  const {
    timeBlocks,
    isLoading: isLoadingTimeBlocks,
    error,
    fetchTimeBlocks,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock
  } = useTimeBlocks();

  const {
    tasks,
    projects,
    categories,
    isLoaded: isTasksLoaded,
    updateTask,
    addTask,
  } = useTaskDatabase();
  
  const { getSchedule } = useWorkSchedule();

  const formattedDate = useMemo(() => {
    try {
      return format(selectedDate, 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return 'Invalid date';
    }
  }, [selectedDate]);
  
  const isCurrentDay = useMemo(() => {
    try {
      return isToday(selectedDate);
    } catch (error) {
      console.error('Error checking if date is today:', error);
      return false;
    }
  }, [selectedDate]);

  const timeBlocksForDay = useMemo(() => {
    try {
      return timeBlocks.filter(block => {
        try {
          const blockDate = parseISO(block.date);
          return isSameDay(blockDate, selectedDate);
        } catch (error) {
          console.error('Error comparing dates:', error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error filtering time blocks for day:', error);
      return [];
    }
  }, [timeBlocks, selectedDate]);

  const sortedTimeBlocks = [...timeBlocksForDay].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  useEffect(() => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      fetchTimeBlocks({
        startDate: formattedDate,
        endDate: formattedDate
      });
    } catch (error) {
      console.error('Error fetching time blocks for date:', error);
      fetchTimeBlocks({
        startDate: dateInputValue,
        endDate: dateInputValue
      });
    }
  }, [selectedDate, fetchTimeBlocks, dateInputValue]);
  
  // Fetch work schedule for the selected date
  useEffect(() => {
    const fetchWorkSchedule = async () => {
      try {
        const schedule = await getSchedule(selectedDate, selectedDate);
        if (schedule.length > 0) {
          const { type, startTime, endTime } = schedule[0];
          setWorkSchedule({ type, startTime, endTime });
        } else {
          setWorkSchedule(null);
        }
      } catch (error) {
        console.error('Error fetching work schedule:', error);
        setWorkSchedule(null);
      }
    };
    
    fetchWorkSchedule();
  }, [selectedDate, getSchedule]);
  
  const {
    timeBlocks: allTimeBlocks,
    isLoading: isLoadingAllBlocks,
    error: allBlocksError,
    fetchTimeBlocks: fetchAllTimeBlocks,
  } = useTimeBlocks();
  
  useEffect(() => {
    fetchAllTimeBlocks();
  }, [fetchAllTimeBlocks]);
  
  const unscheduledTasks = useMemo(() => {
    if (!tasks.length || !allTimeBlocks.length) {
      return tasks.filter(task => !task.completed);
    }
    
    return tasks.filter(task => {
      if (task.completed) return false;
      
      // Check if task is linked via single taskId
      const isLinkedViaSingleTask = allTimeBlocks.some(block => 
        block.taskId === task.id
      );
      
      // Check if task is linked via tasks array
      const isLinkedViaTasksArray = allTimeBlocks.some(block => 
        block.tasks && block.tasks.some(t => t.id === task.id)
      );
      
      return !isLinkedViaSingleTask && !isLinkedViaTasksArray;
    });
  }, [tasks, allTimeBlocks]);

  useEffect(() => {
    if (error) {
      console.error('Time blocks error:', error);
      toast.error('Error', {
        description: error || 'Failed to load time blocks. Please try again.'
      });
    }
  }, [error]);

  const goToPreviousDay = () => {
    try {
      const newDate = subDays(selectedDate, 1);
      setSelectedDate(newDate);
      setDateInputValue(format(newDate, 'yyyy-MM-dd'));
    } catch (error) {
      console.error('Error navigating to previous day:', error);
      toast.error('Failed to navigate to previous day');
    }
  };

  const goToNextDay = () => {
    try {
      const newDate = addDays(selectedDate, 1);
      setSelectedDate(newDate);
      setDateInputValue(format(newDate, 'yyyy-MM-dd'));
    } catch (error) {
      console.error('Error navigating to next day:', error);
      toast.error('Failed to navigate to next day');
    }
  };

  const goToToday = () => {
    try {
      const today = new Date();
      setSelectedDate(today);
      setDateInputValue(format(today, 'yyyy-MM-dd'));
    } catch (error) {
      console.error('Error navigating to today:', error);
      toast.error('Failed to navigate to today');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateInputValue(e.target.value);
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
        const newDate = parse(e.target.value, 'yyyy-MM-dd', new Date());
        if (!isNaN(newDate.getTime())) {
          setSelectedDate(newDate);
        } else {
          console.warn('Invalid date parsed:', e.target.value);
        }
      }
    } catch (error) {
      console.error('Error parsing date input:', error);
    }
  };

  const refreshAllData = useCallback(async () => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      await fetchTimeBlocks({
        startDate: formattedDate,
        endDate: formattedDate
      });
      await fetchAllTimeBlocks();
    } catch (error) {
      console.error('Error refreshing time blocks data:', error);
      toast.error('Error', {
        description: 'Failed to refresh time blocks data. Please try again.'
      });
    }
  }, [selectedDate, fetchTimeBlocks, fetchAllTimeBlocks]);
  
  const handleCreateBlock = useCallback(() => {
    try {
      const now = new Date();
      const hours = now.getHours();
      const startTime = `${hours.toString().padStart(2, '0')}:00`;
      const endTime = `${(hours + 1).toString().padStart(2, '0')}:00`;
      
      let blockDate;
      try {
        blockDate = format(selectedDate, 'yyyy-MM-dd');
      } catch (error) {
        console.error('Error formatting selected date for new block:', error);
        blockDate = dateInputValue;
      }
      
      setEditingBlock({
        id: 'new',
        title: 'New Time Block',
        startTime,
        endTime,
        date: blockDate,
        taskId: null
      });
    } catch (error) {
      console.error('Error creating new time block:', error);
      toast.error('Failed to create new time block');
    }
  }, [selectedDate, dateInputValue]);

  const handleEditBlock = (block: ExtendedTimeBlock) => {
    setEditingBlock(block);
  };

  const handleSaveBlock = useCallback(async (updatedBlock: ExtendedTimeBlock) => {
    try {
      if (updatedBlock.id === 'new') {
        await createTimeBlock({
          title: updatedBlock.title,
          startTime: updatedBlock.startTime,
          endTime: updatedBlock.endTime,
          date: updatedBlock.date,
          taskId: updatedBlock.taskId
        });
        toast.success('Success', {
          description: 'Time block created successfully'
        });
      } else {
        await updateTimeBlock(updatedBlock);
        toast.success('Success', {
          description: 'Time block updated successfully'
        });
      }
      await refreshAllData();
      setEditingBlock(null);
    } catch (error: any) {
      console.error('Failed to save time block:', error);
      toast.error('Error', {
        description: error?.message || 'Failed to save time block. Please try again.'
      });
    }
  }, [createTimeBlock, updateTimeBlock, refreshAllData]);

  const handleDeleteBlock = useCallback(async (blockId: string) => {
    try {
      await deleteTimeBlock(blockId);
      toast.success('Success', {
        description: 'Time block deleted successfully'
      });
      await refreshAllData();
    } catch (error: any) {
      console.error('Failed to delete time block:', error);
      toast.error('Error', {
        description: error?.message || 'Failed to delete time block. Please try again.'
      });
    }
  }, [deleteTimeBlock, refreshAllData]);

  const handleUnlinkTask = useCallback(async (block: ExtendedTimeBlock) => {
    try {
      let updatedBlock: ExtendedTimeBlock;
      
      // If it's a single task via taskId
      if (block.taskId !== undefined && block.taskId !== null) {
        updatedBlock = {
          ...block,
          taskId: null
        };
      } 
      // If it's using the tasks array
      else if (block.tasks && block.tasks.length > 0) {
        updatedBlock = {
          ...block,
          tasks: []
        };
      }
      else {
        // No tasks to unlink
        toast.info('Info', {
          description: 'No tasks to unlink from this time block'
        });
        return;
      }
      
      await updateTimeBlock(updatedBlock);
      toast.success('Success', {
        description: 'Task unlinked from time block'
      });
      await refreshAllData();
    } catch (error: any) {
      console.error('Failed to unlink task from time block:', error);
      toast.error('Error', {
        description: error?.message || 'Failed to unlink task. Please try again.'
      });
    }
  }, [updateTimeBlock, refreshAllData]);
  
  // New handler for unlinking a specific task from a time block with multiple tasks
  const handleUnlinkSpecificTask = useCallback(async (blockId: string, taskId: string) => {
    try {
      const block = timeBlocks.find(b => b.id === blockId);
      if (!block) {
        console.warn(`Block with id ${blockId} not found`);
        return;
      }
      
      let updatedBlock: ExtendedTimeBlock;
      
      // If it's the legacy single task
      if (block.taskId === taskId) {
        updatedBlock = {
          ...block,
          taskId: null
        };
      } 
      // If it's in the tasks array
      else if (block.tasks) {
        // Filter out the task to unlink
        const remainingTasks = block.tasks.filter(t => t.id !== taskId);
        
        if (remainingTasks.length === 0) {
          // If no tasks remain, ensure we have a clean state
          updatedBlock = {
            ...block,
            tasks: [],
            taskId: null
          };
        } else {
          updatedBlock = {
            ...block,
            tasks: remainingTasks
          };
        }
      }
      else {
        // Task not found in this block
        console.warn(`Task ${taskId} not found in block ${blockId}`);
        return;
      }
      
      await updateTimeBlock(updatedBlock);
      toast.success('Success', {
        description: 'Task unlinked from time block'
      });
      await refreshAllData();
    } catch (error: any) {
      console.error('Failed to unlink specific task from time block:', error);
      toast.error('Error', {
        description: error?.message || 'Failed to unlink task. Please try again.'
      });
    }
  }, [timeBlocks, updateTimeBlock, refreshAllData]);

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      if (!taskId) {
        throw new Error('Task ID is required');
      }
      console.log(`Toggling task ${taskId} to ${completed ? 'completed' : 'pending'}`);
      const updatedTask = await updateTask(taskId, { completed });
      console.log('Task update successful:', updatedTask);
      toast.success('Success', {
        description: `Task marked as ${completed ? 'completed' : 'pending'}`
      });
    } catch (error: any) {
      console.error('Failed to update task status:', error);
      toast.error('Error', {
        description: error?.message || 'Failed to update task status. Please try again.'
      });
    }
  };
  
  const handleQuickCreateTask = async (title: string) => {
    try {
      await addTask({
        title,
        completed: false,
        archived: false,
        dueDate: selectedDate,
        projectId: undefined,
        categoryId: undefined,
        parentTaskId: undefined,
        energyLevel: 'medium',
        // Removed activationEnergy field as it doesn't exist in the Task type
      });
      toast.success('Success', {
        description: 'Task created successfully'
      });
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast.error('Error', {
        description: error?.message || 'Failed to create task. Please try again.'
      });
    }
  };

  const handleDragStart = useCallback((task: any) => {
    setActiveDragTask(task.id);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) {
      console.warn('No taskId found in drag data');
      return;
    }
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.warn(`Task with id ${taskId} not found`);
      return;
    }
    const block = timeBlocks.find(b => b.id === blockId);
    if (!block) {
      console.warn(`Block with id ${blockId} not found`);
      return;
    }
    try {
      // Check if task is already linked to this block
      const isTaskAlreadyLinkedViaSingleTask = block.taskId === taskId;
      const isTaskAlreadyLinkedViaMultiTask = block.tasks?.some(t => t.id === taskId);
      
      if (isTaskAlreadyLinkedViaSingleTask || isTaskAlreadyLinkedViaMultiTask) {
        toast.info('Info', {
          description: 'This task is already linked to this time block'
        });
        return;
      }
      
      // Create updated block with the new task added
      let updatedBlock: ExtendedTimeBlock = { ...block };
      
      // If there's a single taskId and no tasks array yet, move it to the tasks array
      if (block.taskId && !block.tasks) {
        updatedBlock.tasks = [
          { id: block.taskId },
          { id: taskId }
        ];
        updatedBlock.taskId = null; // Clear the single taskId as we're using the tasks array now
      }
      // If there's already a tasks array, add the new task to it
      else if (block.tasks && block.tasks.length > 0) {
        updatedBlock.tasks = [
          ...block.tasks,
          { id: taskId }
        ];
      }
      // If there's no taskId and no tasks array, create a new tasks array
      else {
        updatedBlock.tasks = [{ id: taskId }];
      }
      
      await updateTimeBlock(updatedBlock);
      toast.success('Success', {
        description: 'Task linked to time block successfully'
      });
      await refreshAllData();
    } catch (error: any) {
      toast.error('Error', {
        description: error?.message || 'Failed to link task to time block. Please try again.'
      });
    } finally {
      setActiveDragTask(null);
    }
  }, [tasks, timeBlocks, updateTimeBlock, refreshAllData]);

  const isLoading = isLoadingTimeBlocks || !isTasksLoaded || isLoadingAllBlocks;
  
  useEffect(() => {
    const combinedError = error || allBlocksError;
    if (combinedError) {
      console.error('Combined error:', combinedError);
      toast.error('Error', {
        description: combinedError || 'Failed to load time blocks. Please try again.'
      });
    }
  }, [error, allBlocksError]);

  return (
    <div className={styles.dailyPlannerPage}>
      <SonnerToaster />
      
      {editingBlock && (
        <EditTimeBlockModal
          timeBlock={editingBlock}
          onSave={handleSaveBlock}
          onClose={() => setEditingBlock(null)}
          open={!!editingBlock}
        />
      )}
      
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Daily Planner</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.datePickerContainer}>
            <input
              type="date"
              value={dateInputValue}
              onChange={handleDateChange}
              className={styles.datePicker}
            />
            <CalendarIcon className={styles.calendarIcon} size={16} />
          </div>
          <Button onClick={handleCreateBlock}>
            <Plus size={16} /> Add Block
          </Button>
        </div>
      </header>
      
      <div className={styles.dateNavigation}>
        <Button variant="ghost" size="icon-md" onClick={goToPreviousDay}>
          <ChevronLeft size={18} />
        </Button>
        <div className={styles.currentDate}>
          <h2 className={styles.dateHeading}>
            {formattedDate}
            {isCurrentDay && <span className={styles.todayBadge}>Today</span>}
            {workSchedule && (
              <span className={`${styles.workScheduleBadge} ${styles[workSchedule.type]}`} title={`Work hours: ${workSchedule.startTime} - ${workSchedule.endTime}`}>
                <Clock size={12} />
                <span className={styles.workScheduleText}>
                  {workSchedule.type === 'full' ? 'Full day' : 
                   workSchedule.type === 'morning' ? 'Morning' : 
                   'Afternoon'}
                </span>
              </span>
            )}
          </h2>
        </div>
        <Button variant="ghost" size="icon-md" onClick={goToNextDay}>
          <ChevronRight size={18} />
        </Button>
        {!isCurrentDay && (
          <Button variant="outline" size="sm" onClick={goToToday} className={styles.todayButton}>
            Today
          </Button>
        )}
      </div>
      
      <div className={styles.mainContent}>
        {workSchedule && (
          <div className={styles.workScheduleInfo}>
            <Clock size={16} className={styles.workScheduleIcon} />
            <span>
              <strong>Work Schedule:</strong> {workSchedule.type === 'full' ? 'Full day' : 
                workSchedule.type === 'morning' ? 'Morning shift' : 
                'Afternoon shift'} ({workSchedule.startTime} - {workSchedule.endTime})
            </span>
          </div>
        )}
        <div className={styles.sidebarContainer}>
          {isLoading ? (
            <div className={styles.sidebarPlaceholder}>
              <LoadingSpinner />
            </div>
          ) : (
            <div className={styles.sidebarWithQuickCreate}>
              <QuickCreateTask 
                onCreateTask={handleQuickCreateTask}
                isLoading={isLoading}
              />
              <TaskSidebar
                tasks={unscheduledTasks}
                projects={projects}
                categories={categories}
                selectedDate={selectedDate}
                onDragStart={handleDragStart}
                onTaskToggle={handleTaskToggle}
              />
            </div>
          )}
        </div>
        
        <div className={styles.timeBlocksContainer}>
          {workSchedule && (
            <div className={styles.workScheduleOverlay}>
              <div className={`${styles.workScheduleIndicator} ${styles[workSchedule.type]}`}>
                <div className={styles.workScheduleTime}>
                  {workSchedule.startTime}
                </div>
                <div className={styles.workScheduleBar}></div>
                <div className={styles.workScheduleTime}>
                  {workSchedule.endTime}
                </div>
              </div>
            </div>
          )}
          <DailyPlannerTimeBlocks
            timeBlocks={sortedTimeBlocks}
            tasks={tasks}
            projects={projects}
            categories={categories}
            selectedDate={selectedDate}
            isLoading={isLoading}
            activeDragTask={activeDragTask}
            onCreateBlock={handleCreateBlock}
            onEditBlock={handleEditBlock}
            onDeleteBlock={handleDeleteBlock}
            onUnlinkTask={handleUnlinkTask}
            onTaskToggle={handleTaskToggle}
            onDrop={handleDrop}
            onUnlinkSpecificTask={handleUnlinkSpecificTask}
          />
        </div>
      </div>
    </div>
  );
};