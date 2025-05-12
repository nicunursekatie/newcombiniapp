import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './Dialog';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { ExtendedTimeBlock, TimeBlockTask } from './TimeBlockTypes';
import { LoadingSpinner } from './LoadingSpinner';
import { LinkIcon, Unlink, Check, X } from 'lucide-react';
import styles from './EditTimeBlockModal.module.css';

interface EditTimeBlockModalProps {
  timeBlock: ExtendedTimeBlock;
  onSave: (timeBlock: ExtendedTimeBlock) => Promise<void>;
  onClose: () => void;
  open: boolean;
}

export const EditTimeBlockModal: React.FC<EditTimeBlockModalProps> = ({
  timeBlock,
  onSave,
  onClose,
  open
}) => {
  const [title, setTitle] = useState(timeBlock.title);
  const [startTime, setStartTime] = useState(timeBlock.startTime);
  const [endTime, setEndTime] = useState(timeBlock.endTime);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track linked tasks
  const [linkedTasks, setLinkedTasks] = useState<{ id: string }[]>(
    timeBlock.tasks || (timeBlock.taskId ? [{ id: timeBlock.taskId }] : [])
  );

  useEffect(() => {
    if (open) {
      setTitle(timeBlock.title);
      setStartTime(timeBlock.startTime);
      setEndTime(timeBlock.endTime);
      setLinkedTasks(
        timeBlock.tasks || (timeBlock.taskId ? [{ id: timeBlock.taskId }] : [])
      );
    }
  }, [timeBlock, open]);

  // Validate time whenever start or end time changes
  useEffect(() => {
    if (startTime && endTime) {
      if (startTime >= endTime) {
        setError('End time must be after start time');
      } else {
        setError(null);
      }
    }
  }, [startTime, endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submission
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onSave({
        ...timeBlock,
        title,
        startTime,
        endTime,
        taskId: linkedTasks.length === 1 ? linkedTasks[0].id : null,
        tasks: linkedTasks.length > 0 ? linkedTasks : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkAll = () => {
    setLinkedTasks([]);
  };

  const handleToggleTask = (taskId: string) => {
    setLinkedTasks(prev => {
      const exists = prev.some(task => task.id === taskId);
      if (exists) {
        return prev.filter(task => task.id !== taskId);
      } else {
        return [...prev, { id: taskId }];
      }
    });
  };

  const hasLinkedTasks = linkedTasks.length > 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit Time Block
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this time block"
                required
              />
            </div>
            
            <div className={styles.timeFields}>
              <div className={styles.formField}>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.formField}>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
            
            {/* Linked tasks functionality is preserved in the background */}
          </div>
          
          <DialogFooter className={styles.footer}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};