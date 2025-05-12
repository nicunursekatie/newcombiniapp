"use client";

import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QueryProvider } from '../helpers/queryProvider';
import { 
  LayoutDashboard, 
  ListTodo, 
  FolderKanban, 
  Tag, 
  Calendar as CalendarIcon,
  Clock,
  Menu,
  X,
  FileDown,
  Archive,
  BarChart2
} from 'lucide-react';
import { Dialog, DialogContent } from './Dialog';
import { DataImportExport } from './DataImportExport';
import { ThemeModeSwitch } from './ThemeModeSwitch';
import styles from './AppLayout.module.css';
import { useIsMobile } from '../helpers/useIsMobile';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout = ({ children, className = '' }: AppLayoutProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [importExportOpen, setImportExportOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/tasks', label: 'Tasks', icon: <ListTodo size={20} /> },
    { path: '/archived-tasks', label: 'Archived Tasks', icon: <Archive size={20} /> },
    { path: '/projects', label: 'Projects', icon: <FolderKanban size={20} /> },
    { path: '/categories', label: 'Categories', icon: <Tag size={20} /> },
    { path: '/calendar', label: 'Calendar', icon: <CalendarIcon size={20} /> },
    { path: '/daily-planner', label: 'Daily Planner', icon: <Clock size={20} /> },
    { path: '/time-analytics', label: 'Time Analytics', icon: <BarChart2 size={20} /> },
  ];

  return (
    <QueryProvider>
      <div className={`${styles.layout} ${className}`}>
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <button 
          className={styles.sidebarToggle} 
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.appTitle}>TaskFlow</h1>
          <ThemeModeSwitch className={styles.themeSwitch} />
        </div>
        
        <nav className={styles.navigation}>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.path} className={styles.navItem}>
                <Link 
                  to={item.path} 
                  className={`${styles.navLink} ${location.pathname === item.path ? styles.active : ''}`}
                  onClick={closeSidebarOnMobile}
                >
                  {item.icon}
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
      </nav>
      
      <div className={styles.sidebarFooter}>
        <button 
          className={styles.importExportButton}
          onClick={() => setImportExportOpen(true)}
        >
          <FileDown size={18} />
          <span>Import / Export</span>
        </button>
      </div>
    </aside>

    {/* Import/Export Dialog */}
    <Dialog open={importExportOpen} onOpenChange={setImportExportOpen}>
      <DialogContent className={styles.importExportDialog}>
        <DataImportExport 
          onSuccess={(message) => {
            // Could add toast notification here in the future
            setTimeout(() => setImportExportOpen(false), 3000);
          }}
        />
      </DialogContent>
    </Dialog>

    {/* Main content */}
      <main className={styles.main}>
        {children}
      </main>
      </div>
    </QueryProvider>
  );
};