import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DurationPickerProps {
  label: string;
  value: number | null; // Total minutes
  onChange: (totalMinutes: number | null) => void;
  placeholder?: string;
  required?: boolean;
}

export function DurationPicker({ label, value, onChange, placeholder, required }: DurationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const initialHours = value ? Math.floor(value / 60) : 0;
  const initialMinutes = value ? (value % 60) : 0;
  
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);

  useEffect(() => {
    if (value !== null) {
      setHours(Math.floor(value / 60));
      setMinutes(value % 60);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyChanges = () => {
    if (hours === 0 && minutes === 0) {
      onChange(null);
    } else {
      onChange((hours * 60) + minutes);
    }
    setIsOpen(false);
  };
  
  const setUnlimited = () => {
    setHours(0);
    setMinutes(0);
    onChange(null);
    setIsOpen(false);
  };

  const formatDisplayValue = () => {
    if (value === null) return 'Tak Terbatas';
    if (value === 0) return 'Tak Terbatas';
    const h = Math.floor(value / 60);
    const m = value % 60;
    if (h > 0 && m > 0) return `${h} Jam ${m} Menit`;
    if (h > 0) return `${h} Jam`;
    return `${m} Menit`;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-bold text-muted mb-3 flex items-center gap-2 uppercase tracking-wider">
        <Clock className="w-4 h-4 text-cyan-500" /> {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div 
        onClick={() => setIsOpen(true)}
        className="w-full bg-bg border border-border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all"
      >
        <span className={value !== null ? 'text-title font-semibold text-sm' : 'text-muted text-sm'}>
          {value !== null ? formatDisplayValue() : (placeholder || 'Pilih durasi...')}
        </span>
        <div className="flex items-center gap-2">
          {value !== null && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setUnlimited(); }}
              className="p-1 text-muted hover:text-red-400 transition-colors rounded-full hover:bg-red-400/10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-muted" />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 top-full mt-2 left-0 w-64 bg-card border border-border rounded-2xl shadow-2xl p-5 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">Jam</span>
                <input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  className="w-16 bg-bg border border-border rounded-xl text-center text-xl font-bold py-2 focus:outline-none focus:border-emerald-500 text-title [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
              <div className="text-2xl font-bold text-muted mt-6">:</div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">Menit</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => {
                    let m = parseInt(e.target.value) || 0;
                    if (m > 59) m = 59;
                    setMinutes(m);
                  }}
                  className="w-16 bg-bg border border-border rounded-xl text-center text-xl font-bold py-2 focus:outline-none focus:border-emerald-500 text-title [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={applyChanges}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                Atur Durasi
              </button>
              <button
                type="button"
                onClick={setUnlimited}
                className="w-full bg-bg border border-border text-title hover:border-emerald-500/30 hover:text-emerald-500 font-bold py-2.5 rounded-xl transition-all"
              >
                Set Tak Terbatas
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
