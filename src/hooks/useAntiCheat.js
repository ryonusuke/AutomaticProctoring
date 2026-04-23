import { useState, useEffect, useCallback } from 'react';

export const useAntiCheat = (maxWarnings = 3) => {
  const [warnings, setWarnings] = useState([]);
  const [isTerminated, setIsTerminated] = useState(false);

  const triggerWarning = useCallback((reason) => {
    setWarnings((prev) => {
      const newWarnings = [...prev, { reason, timestamp: new Date().toISOString() }];
      if (newWarnings.length >= maxWarnings) {
        setIsTerminated(true);
      }
      return newWarnings;
    });
  }, [maxWarnings]);

  useEffect(() => {
    // 1. Detect Tab Switching / Window Minimizing
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerWarning('User navigated away from the exam tab.');
      }
    };

    // 2. Prevent Right Click (Context Menu)
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 3. Prevent Copy/Paste
    const handleClipboard = (e) => {
      e.preventDefault();
      triggerWarning('Clipboard action (Copy/Paste) blocked.');
    };

    // 4. Prevent Keyboard Shortcuts (Alt+Tab, Ctrl+C, etc. handled by browser, but we can block some)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'p')) {
        e.preventDefault();
        triggerWarning('Unauthorized keyboard shortcut detected.');
      }
    };

    // Attach Listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleClipboard);
    document.addEventListener('paste', handleClipboard);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleClipboard);
      document.removeEventListener('paste', handleClipboard);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [triggerWarning]);

  return { warnings, isTerminated, warningCount: warnings.length };
};