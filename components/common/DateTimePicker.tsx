import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateTimePickerProps {
  label: string;
  value: string | undefined;
  onChange: (isoString: string | undefined) => void;
  placeholder?: string;
  required?: boolean;
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function DateTimePicker({ label, value, onChange, placeholder, required }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  
  const [hours, setHours] = useState(value ? new Date(value).getHours().toString().padStart(2, '0') : '23');
  const [minutes, setMinutes] = useState(value ? new Date(value).getMinutes().toString().padStart(2, '0') : '59');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day, parseInt(hours), parseInt(minutes));
    setSelectedDate(newDate);
  };

  const applyChanges = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate);
      finalDate.setHours(parseInt(hours), parseInt(minutes));
      onChange(finalDate.toISOString());
    }
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
      const iterDate = new Date(currentYear, currentMonth, i);
      const isPast = iterDate < today;
      const isSelected = selectedDate?.getDate() === i && selectedDate?.getMonth() === currentMonth && selectedDate?.getFullYear() === currentYear;
      const isToday = today.getDate() === i && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
      
      days.push(
        <button
          key={i}
          type="button"
          disabled={isPast}
          onClick={(e) => { e.preventDefault(); handleDateClick(i); }}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all ${
            isPast
              ? 'opacity-30 cursor-not-allowed text-muted'
              : isSelected 
              ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/30' 
              : isToday 
              ? 'bg-black/10 dark:bg-white/10 text-emerald-500 font-bold'
              : 'text-title hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return days;
  };

  const formatDisplayValue = () => {
    if (!value) return '';
    const d = new Date(value);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-title mb-2 flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-emerald-500" /> {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div 
        onClick={() => setIsOpen(true)}
        className="w-full bg-bg border border-border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all"
      >
        <span className={value ? 'text-title font-semibold text-sm' : 'text-muted text-sm'}>
          {value ? formatDisplayValue() : (placeholder || 'Pilih tanggal dan waktu...')}
        </span>
        {value ? (
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(undefined); setSelectedDate(null); }}
            className="p-1 text-muted hover:text-red-400 transition-colors rounded-full hover:bg-red-400/10"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <CalendarIcon className="w-4 h-4 text-muted" />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 top-full mt-2 left-0 w-72 bg-card border border-border rounded-2xl shadow-2xl p-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={(e) => { e.preventDefault(); handlePrevMonth(); }} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-title transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="font-bold text-sm text-title">
                {MONTHS[currentMonth]} {currentYear}
              </div>
              <button type="button" onClick={(e) => { e.preventDefault(); handleNextMonth(); }} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-title transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => (
                <div key={d} className="w-8 h-8 flex items-center justify-center text-xs font-bold text-muted">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4">
              {renderCalendar()}
            </div>

            <div className="border-t border-border pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-title">
                  <Clock className="w-4 h-4 text-emerald-500" /> Waktu
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={(e) => {
                      let h = parseInt(e.target.value) || 0;
                      if (h > 23) h = 23;
                      setHours(h.toString().padStart(2, '0'));
                    }}
                    className="w-12 bg-bg border border-border rounded-lg text-center text-sm py-1 focus:outline-none focus:border-emerald-500 text-title [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="00"
                  />
                  <span className="text-title font-bold">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => {
                      let m = parseInt(e.target.value) || 0;
                      if (m > 59) m = 59;
                      setMinutes(m.toString().padStart(2, '0'));
                    }}
                    className="w-12 bg-bg border border-border rounded-lg text-center text-sm py-1 focus:outline-none focus:border-emerald-500 text-title [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="00"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={applyChanges}
              disabled={!selectedDate}
              className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              Simpan Tanggal
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
