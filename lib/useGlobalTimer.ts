import { useEffect } from 'react';
import { useTimerStore } from '@/lib/store';

/**
 * Global timer hook that runs the Pomodoro timer in the background
 * This should be mounted at the app level to persist across navigation
 */
export function useGlobalTimer() {
  const { status, tick } = useTimerStore();

  useEffect(() => {
    if (status === 'running') {
      const interval = setInterval(() => {
        tick();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, tick]);
}
