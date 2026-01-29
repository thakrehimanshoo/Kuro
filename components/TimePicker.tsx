'use client';

import { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
  label?: string;
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState(value.split(':')[0] || '09');
  const [minute, setMinute] = useState(value.split(':')[1] || '00');
  const [period, setPeriod] = useState(parseInt(hour) >= 12 ? 'PM' : 'AM');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const [h, m] = value.split(':');
    if (h && m) {
      const hourNum = parseInt(h);
      setHour(h);
      setMinute(m);
      setPeriod(hourNum >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSave = () => {
    let h = parseInt(hour);
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    onChange(`${h.toString().padStart(2, '0')}:${minute}`);
    setIsOpen(false);
  };

  const displayHour = () => {
    const h = parseInt(hour);
    if (h === 0) return '12';
    if (h > 12) return (h - 12).toString();
    return h.toString();
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = ['00', '15', '30', '45'];

  const renderPickerContent = () => (
    <>
      <div className="flex gap-3 mb-4">
        {/* Hours */}
        <div className="flex-1">
          <div className="text-xs opacity-60 mb-2">Hour</div>
          <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
            {hours.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  let newHour = h;
                  if (period === 'PM' && h < 12) newHour += 12;
                  if (period === 'AM' && h === 12) newHour = 0;
                  setHour(newHour.toString().padStart(2, '0'));
                }}
                className={`min-h-11 py-2.5 rounded-lg text-sm transition-all active:scale-95 ${
                  displayHour() === h.toString()
                    ? 'bg-[#8ab4f8] text-[#202124] font-medium'
                    : 'hover:bg-white/10 active:bg-white/20'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Minutes */}
        <div className="flex-1">
          <div className="text-xs opacity-60 mb-2">Minute</div>
          <div className="grid grid-cols-2 gap-1.5">
            {minutes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinute(m)}
                className={`min-h-11 py-2.5 rounded-lg text-sm transition-all active:scale-95 ${
                  minute === m
                    ? 'bg-[#8ab4f8] text-[#202124] font-medium'
                    : 'hover:bg-white/10 active:bg-white/20'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* AM/PM */}
        <div className="flex-shrink-0">
          <div className="text-xs opacity-60 mb-2">Period</div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setPeriod('AM')}
              className={`px-4 min-h-11 py-2.5 rounded-lg text-sm transition-all active:scale-95 ${
                period === 'AM'
                  ? 'bg-[#8ab4f8] text-[#202124] font-medium'
                  : 'hover:bg-white/10 active:bg-white/20'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setPeriod('PM')}
              className={`px-4 min-h-11 py-2.5 rounded-lg text-sm transition-all active:scale-95 ${
                period === 'PM'
                  ? 'bg-[#8ab4f8] text-[#202124] font-medium'
                  : 'hover:bg-white/10 active:bg-white/20'
              }`}
            >
              PM
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full min-h-11 py-3 bg-[#8ab4f8] text-[#202124] rounded-lg font-medium hover:bg-[#aecbfa] active:scale-[0.98] transition-all"
      >
        Done
      </button>
    </>
  );

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm opacity-60 mb-2">{label}</label>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#8ab4f8] transition-all flex items-center justify-between"
      >
        <span>{displayHour()}:{minute} {period}</span>
        <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Time picker modal - centered on all screen sizes */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-3 xs:px-4">
          <div className="bg-[#202124] border border-white/10 rounded-2xl p-4 xs:p-5 shadow-2xl w-full max-w-[300px] xs:max-w-[320px]">
            {renderPickerContent()}
          </div>
        </div>
      )}
    </div>
  );
}
