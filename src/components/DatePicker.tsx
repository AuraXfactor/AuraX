'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, className = '', placeholder = 'Select date' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState({
    day: 1,
    month: 1,
    year: new Date().getFullYear() - 18
  });

  // Generate arrays for days, months, years
  const daysInSelectedMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate();
  const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);
  const months = [
    { value: 1, name: 'Jan' },
    { value: 2, name: 'Feb' },
    { value: 3, name: 'Mar' },
    { value: 4, name: 'Apr' },
    { value: 5, name: 'May' },
    { value: 6, name: 'Jun' },
    { value: 7, name: 'Jul' },
    { value: 8, name: 'Aug' },
    { value: 9, name: 'Sep' },
    { value: 10, name: 'Oct' },
    { value: 11, name: 'Nov' },
    { value: 12, name: 'Dec' }
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate({
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear()
        });
      }
    }
  }, [value]);

  // Update parent when date changes
  useEffect(() => {
    const daysInMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate();
    const validDay = Math.min(selectedDate.day, daysInMonth);
    
    const dateString = `${selectedDate.year}-${selectedDate.month.toString().padStart(2, '0')}-${validDay.toString().padStart(2, '0')}`;
    onChange(dateString);
  }, [selectedDate, onChange]);

  const formatDisplayDate = () => {
    if (!value) return placeholder;
    const date = new Date(value);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDateChange = (type: 'day' | 'month' | 'year', value: number) => {
    setSelectedDate(prev => {
      let newDate = { ...prev, [type]: value };
      
      // Validate day based on month and year
      const daysInMonth = new Date(newDate.year, newDate.month, 0).getDate();
      if (newDate.day > daysInMonth) {
        newDate.day = daysInMonth;
      }
      
      return newDate;
    });
  };

  const WheelColumn = ({ items, selectedValue, onValueChange, label }: {
    items: (number | { value: number; name: string })[];
    selectedValue: number;
    onValueChange: (value: number) => void;
    label: string;
  }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemHeight = 50;
    const visibleItems = 3;

    useEffect(() => {
      if (scrollRef.current) {
        const index = items.findIndex(item => 
          typeof item === 'number' ? item === selectedValue : item.value === selectedValue
        );
        if (index !== -1) {
          scrollRef.current.scrollTop = index * itemHeight;
        }
      }
    }, [selectedValue, items]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
      
      const item = items[clampedIndex];
      const value = typeof item === 'number' ? item : item.value;
      
      if (value !== selectedValue) {
        onValueChange(value);
      }
    };

    return (
      <div className="flex flex-col items-center">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</div>
        <div className="relative h-40 w-20 overflow-hidden">
          <div
            ref={scrollRef}
            className="overflow-y-auto scrollbar-hide h-full"
            onScroll={handleScroll}
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {/* Top padding */}
            <div style={{ height: itemHeight }} />
            
            {items.map((item, index) => {
              const value = typeof item === 'number' ? item : item.value;
              const display = typeof item === 'number' ? item.toString().padStart(2, '0') : item.name;
              const isSelected = value === selectedValue;
              
              return (
                <div
                  key={index}
                  className={`flex items-center justify-center h-12 text-sm font-medium transition-all duration-200 ${
                    isSelected 
                      ? 'text-purple-600 dark:text-purple-400 scale-110 font-bold' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  style={{ 
                    height: itemHeight,
                    scrollSnapAlign: 'center'
                  }}
                >
                  {display}
                </div>
              );
            })}
            
            {/* Bottom padding */}
            <div style={{ height: itemHeight }} />
          </div>
          
          {/* Selection indicator */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg pointer-events-none border border-purple-200 dark:border-purple-700" />
          
          {/* Gradient overlays */}
          <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white dark:from-gray-800 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none" />
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
          {formatDisplayDate()}
        </span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg z-50 p-6"
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Select Date of Birth
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Scroll to select your birth date
              </p>
            </div>

            <div className="flex justify-center gap-6 mb-6">
              <WheelColumn
                items={days}
                selectedValue={selectedDate.day}
                onValueChange={(value) => handleDateChange('day', value)}
                label="Day"
              />
              <WheelColumn
                items={months}
                selectedValue={selectedDate.month}
                onValueChange={(value) => handleDateChange('month', value)}
                label="Month"
              />
              <WheelColumn
                items={years}
                selectedValue={selectedDate.year}
                onValueChange={(value) => handleDateChange('year', value)}
                label="Year"
              />
            </div>

            {/* Selected Date Display */}
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-4">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Selected: {formatDisplayDate()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}