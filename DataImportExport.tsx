import React, { useState, useRef } from "react";
import { Download, Upload, Check, AlertCircle, X, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useDataExport } from "../helpers/dataExport";
import { Button } from "./Button";
import { FileDropzone } from "./FileDropzone";
import { Progress } from "./Progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./Dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Tooltip";
import { useIsMobile } from "../helpers/useIsMobile";
import styles from "./DataImportExport.module.css";

type DataSection = "all" | "tasks" | "projects" | "categories" | "timeBlocks";

interface DataImportExportProps {
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  defaultSection?: DataSection;
}

export const DataImportExport: React.FC<DataImportExportProps> = ({
  className,
  onSuccess,
  onError,
  defaultSection = "all",
}) => {
  const { exportData, importData } = useDataExport();
  const [selectedSection, setSelectedSection] = useState<DataSection>(defaultSection);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showAdvancedExport, setShowAdvancedExport] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessages, setDialogMessages] = useState<{ success: string[]; errors: string[] }>({
    success: [],
    errors: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleExport = (section: DataSection) => {
    setIsExporting(true);
    setStatusMessage("Preparing export...");
    setStatusType("info");

    try {
      if (section === "all") {
        exportData();
      } else {
        exportData({
          tasks: section === "tasks",
          projects: section === "projects",
          categories: section === "categories",
          timeBlocks: section === "timeBlocks",
        });
      }
      
      setStatusMessage("Data exported successfully!");
      setStatusType("success");
      if (onSuccess) onSuccess("Data exported successfully");
    } catch (error) {
      const errorMsg = "Export failed. Please try again.";
      setStatusMessage(errorMsg);
      setStatusType("error");
      if (onError) onError(errorMsg);
    } finally {
      setIsExporting(false);
      // Clear success message after 3 seconds
      if (statusType === "success") {
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      }
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsImporting(true);
    setImportProgress(10);
    setStatusMessage("Importing data...");
    setStatusType("info");

    try {
      setImportProgress(30);
      
      const result = await importData(files[0], {
        tasks: selectedSection === "all" || selectedSection === "tasks",
        projects: selectedSection === "all" || selectedSection === "projects",
        categories: selectedSection === "all" || selectedSection === "categories",
        timeBlocks: selectedSection === "all" || selectedSection === "timeBlocks",
      });
      
      setImportProgress(100);
      setDialogMessages(result);
      
      if (result.errors.length > 0) {
        setStatusMessage(`Import completed with ${result.errors.length} errors`);
        setStatusType("error");
        setDialogOpen(true);
        if (onError) onError(`Import completed with ${result.errors.length} errors`);
      } else {
        setStatusMessage(`Successfully imported ${result.success.length} items`);
        setStatusType("success");
        if (onSuccess) onSuccess(`Successfully imported ${result.success.length} items`);
      }
    } catch (error) {
      setImportProgress(100);
      setStatusMessage("Import failed. Please check file format.");
      setStatusType("error");
      if (onError) onError("Import failed. Please check file format.");
    } finally {
      setIsImporting(false);
      // Clear success message after 3 seconds
      if (statusType === "success") {
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      }
    }
  };

  const handleFileDrop = (files: File[]) => {
    handleFileSelected(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(Array.from(e.target.files));
    }
  };

  const clearStatus = () => {
    setStatusMessage(null);
  };

  const getSectionLabel = (section: DataSection): string => {
    switch (section) {
      case "all": return "All Data";
      case "tasks": return "Tasks";
      case "projects": return "Projects";
      case "categories": return "Categories";
      case "timeBlocks": return "Time Blocks";
    }
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <TooltipProvider>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Export Data</h3>
          <p className={styles.sectionDescription}>
            Export your data to a JSON file that you can save as a backup or transfer to another device.
          </p>
          
          <div className={styles.exportOptions}>
            <Button 
              onClick={() => handleExport("all")}
              disabled={isExporting}
              className={styles.exportButton}
            >
              <Download size={16} /> Export All Data
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAdvancedExport(!showAdvancedExport)}
              className={styles.advancedButton}
            >
              {showAdvancedExport ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Advanced Options
            </Button>
          </div>
          
          {showAdvancedExport && (
            <div className={styles.advancedExportOptions}>
              <div className={styles.exportGrid}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size={isMobile ? "sm" : "md"}
                      onClick={() => handleExport("tasks")}
                      disabled={isExporting}
                    >
                      Export Tasks
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export only your tasks</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size={isMobile ? "sm" : "md"}
                      onClick={() => handleExport("projects")}
                      disabled={isExporting}
                    >
                      Export Projects
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export only your projects</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size={isMobile ? "sm" : "md"}
                      onClick={() => handleExport("categories")}
                      disabled={isExporting}
                    >
                      Export Categories
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export only your categories</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size={isMobile ? "sm" : "md"}
                      onClick={() => handleExport("timeBlocks")}
                      disabled={isExporting}
                    >
                      Export Time Blocks
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export only your time blocks</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.divider} />
        
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Import Data</h3>
          <p className={styles.sectionDescription}>
            Import data from a previously exported JSON file. You can choose to merge with or replace your existing data.
          </p>
          
          <div className={styles.importOptions}>
            <div className={styles.sectionSelect}>
              <label className={styles.selectLabel}>Import section:</label>
              <select 
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value as DataSection)}
                className={styles.select}
                disabled={isImporting}
              >
                <option value="all">All Data</option>
                <option value="tasks">Tasks Only</option>
                <option value="projects">Projects Only</option>
                <option value="categories">Categories Only</option>
                <option value="timeBlocks">Time Blocks Only</option>
              </select>
            </div>
            
            <Button 
              onClick={handleImportClick}
              disabled={isImporting}
              variant="secondary"
              className={styles.importButton}
            >
              <Upload size={16} /> Select File to Import
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>
          
          <div className={styles.dropzoneContainer}>
            <FileDropzone
              accept=".json"
              maxFiles={1}
              onFilesSelected={handleFileDrop}
              disabled={isImporting}
              icon={<FileText size={48} />}
              title={`Drop ${getSectionLabel(selectedSection)} JSON file here`}
              subtitle="Files exported from this app (.json)"
            />
          </div>
        </div>
        
        {isImporting && (
          <div className={styles.progressContainer}>
            <Progress value={importProgress} />
            <p className={styles.progressText}>Importing data... {importProgress}%</p>
          </div>
        )}
        
        {statusMessage && (
          <div className={`${styles.statusMessage} ${styles[statusType]}`}>
            <span className={styles.statusIcon}>
              {statusType === "success" && <Check size={18} />}
              {statusType === "error" && <AlertCircle size={18} />}
              {statusType === "info" && <FileText size={18} />}
            </span>
            <span>{statusMessage}</span>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={clearStatus}
              className={styles.clearButton}
            >
              <X size={14} />
            </Button>
          </div>
        )}
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Results</DialogTitle>
              <DialogDescription>
                The import process has completed with the following results:
              </DialogDescription>
            </DialogHeader>
            
            {dialogMessages.success.length > 0 && (
              <div className={styles.resultSection}>
                <h4 className={styles.resultTitle}>
                  <Check size={16} className={styles.successIcon} /> 
                  Successful Operations ({dialogMessages.success.length})
                </h4>
                <ul className={styles.resultList}>
                  {dialogMessages.success.map((msg, i) => (
                    <li key={`success-${i}`}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {dialogMessages.errors.length > 0 && (
              <div className={styles.resultSection}>
                <h4 className={styles.resultTitle}>
                  <AlertCircle size={16} className={styles.errorIcon} /> 
                  Errors ({dialogMessages.errors.length})
                </h4>
                <ul className={styles.resultList}>
                  {dialogMessages.errors.map((msg, i) => (
                    <li key={`error-${i}`}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </div>
  );
};