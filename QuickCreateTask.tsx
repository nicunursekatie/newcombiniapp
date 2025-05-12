import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import styles from './QuickCreateTask.module.css';

interface QuickCreateTaskProps {
  onCreateTask: (title: string) => Promise<void>;
  isLoading?: boolean;
}

export const QuickCreateTask: React.FC<QuickCreateTaskProps> = ({
  onCreateTask,
  isLoading = false
}) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskTitle.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onCreateTask(taskTitle.trim());
      setTaskTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <Input
        type="text"
        placeholder="Add a new task..."
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        className={styles.input}
        disabled={isSubmitting || isLoading}
      />
      <Button 
        type="submit" 
        size="sm" 
        disabled={!taskTitle.trim() || isSubmitting || isLoading}
        className={styles.button}
      >
        <Plus size={16} />
        Add
      </Button>
    </form>
  );
};