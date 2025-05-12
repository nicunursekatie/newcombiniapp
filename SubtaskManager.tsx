import React, { useState } from "react";
import { 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Edit, 
  Save, 
  X
} from "lucide-react";
import { Task } from "../helpers/TaskStorage";
import { useTimeEstimates } from "../helpers/useTimeEstimates";
import { Button } from "./Button";
import { Input } from "./Input";
import { Checkbox } from "./Checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./Collapsible";
import styles from "./SubtaskManager.module.css";

export interface SubtaskManagerProps {
  subtasks: Task[];
  onSubtaskChange: (updatedSubtask: Task) => void;
  onAddSubtask: (subtask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onReorderSubtasks: (fromIndex: number, toIndex: number) => void;
  parentTaskId: string;
  className?: string;
}

export const SubtaskManager = ({
  subtasks,
  onSubtaskChange,
  onAddSubtask,
  onReorderSubtasks,
  parentTaskId,
  className = "",
}: SubtaskManagerProps) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [expandedSubtaskId, setExpandedSubtaskId] = useState<string | null>(null);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Use the time estimates hook
  const { formatTime, totalEstimate } = useTimeEstimates();
  
  // Calculate total estimated time using the hook's function
  const totalEstimatedMinutes = subtasks.reduce(
    (total, subtask) => total + totalEstimate(subtask),
    0
  );

  const handleToggleComplete = (subtaskId: string, completed: boolean) => {
    const subtask = subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      onSubtaskChange({ ...subtask, completed });
    }
  };

  const handleEstimateChange = (subtaskId: string, minutes: number | undefined) => {
    const subtask = subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      onSubtaskChange({ ...subtask, estimatedMinutes: minutes });
    }
  };

  const handlePriorityChange = (subtaskId: string, priority: 'low' | 'medium' | 'high' | undefined) => {
    const subtask = subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      onSubtaskChange({ ...subtask, priority });
    }
  };

  const handleEmotionalWeightChange = (subtaskId: string, emotionalWeight: 'none' | 'minimal' | 'significant' | undefined) => {
    const subtask = subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      onSubtaskChange({ ...subtask, emotionalWeight });
    }
  };

  const handleMentalComplexityChange = (subtaskId: string, mentalComplexity: 'easy' | 'moderate' | 'complex' | undefined) => {
    const subtask = subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      onSubtaskChange({ ...subtask, mentalComplexity });
    }
  };

  const { suggestTime } = useTimeEstimates();

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    // Default to an easy, medium priority task with minimal emotional weight for time estimate
    const suggestedTime = suggestTime({
      mentalComplexity: 'easy',
      priority: 'medium'
    });

    onAddSubtask({
      title: newSubtaskTitle,
      completed: false,
      archived: false,
      parentTaskId: parentTaskId,
      estimatedMinutes: suggestedTime,
      emotionalWeight: 'none',
      mentalComplexity: 'easy',
      priority: 'medium'
    });

    setNewSubtaskTitle("");
  };

  const handleMoveSubtask = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < subtasks.length) {
      onReorderSubtasks(index, newIndex);
    }
  };

  const handleStartEditing = (subtask: Task) => {
    setEditingSubtaskId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const handleSaveEditing = (subtaskId: string) => {
    if (!editingTitle.trim()) return;
    
    const subtask = subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      onSubtaskChange({ ...subtask, title: editingTitle });
    }
    
    setEditingSubtaskId(null);
  };

  const handleCancelEditing = () => {
    setEditingSubtaskId(null);
  };

  const toggleExpand = (subtaskId: string) => {
    setExpandedSubtaskId(expandedSubtaskId === subtaskId ? null : subtaskId);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {subtasks.length > 0 && (
        <div className={styles.summary}>
          <Clock size={16} />
          <span>Total estimated time: {formatTime(totalEstimatedMinutes)}</span>
        </div>
      )}

      <div className={styles.subtasksList}>
        {subtasks.length === 0 ? (
          <div className={styles.emptyState}>No subtasks yet</div>
        ) : (
          subtasks.map((subtask, index) => (
            <div key={subtask.id} className={styles.subtaskItem}>
              <div className={styles.subtaskHeader}>
                <div className={styles.subtaskControls}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleMoveSubtask(index, "up")}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleMoveSubtask(index, "down")}
                    disabled={index === subtasks.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown size={14} />
                  </Button>
                </div>

                <Checkbox
                  checked={subtask.completed}
                  onChange={(e) => handleToggleComplete(subtask.id, e.target.checked)}
                  aria-label={`Mark ${subtask.title} as ${subtask.completed ? 'incomplete' : 'complete'}`}
                />

                {editingSubtaskId === subtask.id ? (
                  <div className={styles.editTitleContainer}>
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className={styles.editTitleInput}
                      autoFocus
                    />
                    <div className={styles.editActions}>
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        onClick={() => handleSaveEditing(subtask.id)}
                        aria-label="Save"
                      >
                        <Save size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        onClick={handleCancelEditing}
                        aria-label="Cancel"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.subtaskTitleContainer}>
                    <span className={`${styles.subtaskTitle} ${subtask.completed ? styles.completed : ''}`}>
                      {subtask.title}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon-sm" 
                      onClick={() => handleStartEditing(subtask)}
                      aria-label="Edit title"
                      className={styles.editButton}
                    >
                      <Edit size={14} />
                    </Button>
                  </div>
                )}

                <div className={styles.timeEstimateContainer}>
                  <Input
                    type="number"
                    value={subtask.estimatedMinutes || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      handleEstimateChange(subtask.id, value);
                    }}
                    min="0"
                    placeholder="0"
                    className={styles.timeEstimateInput}
                    aria-label="Time estimate in minutes"
                  />
                  <div className={styles.timeEstimateLabel}>
                    <Clock size={14} />
                    <span>{formatTime(subtask.estimatedMinutes || 0)}</span>
                  </div>
                </div>

                <div className={styles.subtaskMeta}>
                  {subtask.priority && (
                    <div className={`${styles.priorityTag} ${styles[`priority-${subtask.priority}`]}`}>
                      {subtask.priority}
                    </div>
                  )}
                  
                  {subtask.emotionalWeight && subtask.emotionalWeight !== 'none' && (
                    <div className={`${styles.emotionalWeightTag} ${styles[`emotional-${subtask.emotionalWeight}`]}`}>
                      {subtask.emotionalWeight}
                    </div>
                  )}
                  
                  {subtask.mentalComplexity && (
                    <div className={`${styles.complexityTag} ${styles[`complexity-${subtask.mentalComplexity}`]}`}>
                      {subtask.mentalComplexity}
                    </div>
                  )}
                </div>

              </div>

              <Collapsible open={expandedSubtaskId === subtask.id}>
                <CollapsibleTrigger
                  onClick={() => toggleExpand(subtask.id)}
                  className={styles.expandTrigger}
                  aria-label={expandedSubtaskId === subtask.id ? "Collapse details" : "Expand details"}
                >
                  {expandedSubtaskId === subtask.id ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className={styles.subtaskDetails}>
                  <div className={styles.detailsGrid}>


                    <div className={styles.detailField}>
                      <label className={styles.fieldLabel}>Priority</label>
                      <Select
                        value={subtask.priority || ''}
                        onValueChange={(value) => handlePriorityChange(
                          subtask.id, 
                          value === '' ? undefined : value as 'low' | 'medium' | 'high'
                        )}
                      >
                        <SelectTrigger className={styles.selectTrigger}>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not set</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={styles.detailField}>
                      <label className={styles.fieldLabel}>Emotional Weight</label>
                      <Select
                        value={subtask.emotionalWeight || ''}
                        onValueChange={(value) => handleEmotionalWeightChange(
                          subtask.id, 
                          value === '' ? undefined : value as 'none' | 'minimal' | 'significant'
                        )}
                      >
                        <SelectTrigger className={styles.selectTrigger}>
                          <SelectValue placeholder="Select emotional weight" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not set</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="significant">Significant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={styles.detailField}>
                      <label className={styles.fieldLabel}>Mental Complexity</label>
                      <Select
                        value={subtask.mentalComplexity || ''}
                        onValueChange={(value) => handleMentalComplexityChange(
                          subtask.id, 
                          value === '' ? undefined : value as 'easy' | 'moderate' | 'complex'
                        )}
                      >
                        <SelectTrigger className={styles.selectTrigger}>
                          <SelectValue placeholder="Select mental complexity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not set</SelectItem>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="complex">Complex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))
        )}
      </div>

      <div className={styles.addSubtaskForm}>
        <Input
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          placeholder="New subtask..."
          className={styles.addSubtaskInput}
        />
        <Button 
          size="sm" 
          onClick={handleAddSubtask}
          disabled={!newSubtaskTitle.trim()}
        >
          <Plus size={16} /> Add
        </Button>
      </div>
    </div>
  );
};