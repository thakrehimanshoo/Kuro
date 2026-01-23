'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const tabs = [
  { name: 'Timer', path: '/', icon: ClockIcon },
  { name: 'Tasks', path: '/tasks', icon: CheckSquareIcon },
  { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
  { name: 'Notes', path: '/notes', icon: BookIcon },
  { name: 'Stats', path: '/stats', icon: BarChartIcon },
  { name: 'Settings', path: '/settings', icon: SettingsIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 safe-bottom z-50">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.path}
                href={tab.path}
                prefetch={true}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-opacity duration-150 ${
                  isActive ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs">{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-black border-r border-white/10 flex-col z-50">
        <div className="p-8">
          <h1 className="text-2xl font-extralight tracking-tight">Kuro</h1>
          <p className="text-xs opacity-30 mt-1">Focus Timer</p>
        </div>

        <div className="flex-1 px-4 space-y-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.path}
                href={tab.path}
                prefetch={true}
                className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-white/10 opacity-100'
                    : 'opacity-40 hover:opacity-70 hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-6 border-t border-white/10">
          <div className="text-xs opacity-30">
            Press ⌘K for shortcuts
          </div>
        </div>
      </nav>
    </>
  );
}

function CheckSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
