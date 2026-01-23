'use client';

import { useGlobalTimer } from '@/lib/useGlobalTimer';
import { ReactNode } from 'react';

export function GlobalTimerProvider({ children }: { children: ReactNode }) {
  useGlobalTimer();
  return <>{children}</>;
}
