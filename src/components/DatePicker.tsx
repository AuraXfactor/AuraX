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
    year: new Date().getFullYear() - 18 // Default to 18 years ago
  });
  const [hasUserSelected, setHasUserSelected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate arrays for days, months, years
  const daysInSelectedMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate();
  const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);
  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Parse initial value
  useEffect(() => {
    if (value && !isInitialized) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate({
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear()
        });
        setHasUserSelected(true); // Mark that we have a valid initial value
      }
      setIsInitialized(true);
    } else if (!value && !isInitialized) {
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  // Update parent when date changes (only if user has made a selection)
  useEffect(() => {
    if (hasUserSelected) {
      // Validate the date before creating the string
      const daysInMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate();
      const validDay = Math.min(selectedDate.day, daysInMonth);
      
      const dateString = `${selectedDate.year}-${selectedDate.month.toString().padStart(2, '0')}-${validDay.toString().padStart(2, '0')}`;
      onChange(dateString);
    }
  }, [selectedDate, onChange, hasUserSelected]);

  const formatDisplayDate = () => {
    // Show placeholder if no user selection has been made and no initial value
    if (!hasUserSelected && !value) return placeholder;
    
    // Use the internal selectedDate state for display, not the value prop
    const dateString = `${selectedDate.year}-${selectedDate.month.toString().padStart(2, '0')}-${selectedDate.day.toString().padStart(2, '0')}`;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleScroll = (type: 'day' | 'month' | 'year', value: number) => {
    setHasUserSelected(true); // Mark that user has made a selection
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

  const WheelPicker = ({ items, selectedValue, onValueChange, type }: {
    items: (number | { value: number; name: string })[];
    selectedValue: number;
    onValueChange: (value: number) => void;
    type: 'day' | 'month' | 'year';
  }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const itemHeight = 40;
    const visibleItems = 5;
    const containerHeight = itemHeight * visibleItems;
    const centerOffset = itemHeight * 2; // Offset to center the first item

    // Initialize scroll position when selectedValue changes
    useEffect(() => {
      const index = items.findIndex(item => 
        typeof item === 'number' ? item === selectedValue : item.value === selectedValue
      );
      if (index !== -1 && scrollRef.current) {
        const targetScrollTop = index * itemHeight;
        scrollRef.current.scrollTop = targetScrollTop;
      }
    }, [selectedValue, items, itemHeight]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set new timeout to detect when scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        
        // Snap to nearest item when scrolling stops
        const scrollTop = e.currentTarget.scrollTop;
        const index = Math.round(scrollTop / itemHeight);
        const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
        
        // Smooth scroll to the exact position
        const targetScrollTop = clampedIndex * itemHeight;
        e.currentTarget.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
        
        const item = items[clampedIndex];
        const value = typeof item === 'number' ? item : item.value;
        
        if (value !== selectedValue) {
          onValueChange(value);
        }
      }, 100); // Reduced timeout for more responsive snapping
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      
      if (!scrollRef.current) return;
      
      const delta = e.deltaY;
      const currentScrollTop = scrollRef.current.scrollTop;
      const newScrollTop = currentScrollTop + delta * 0.5; // Reduce wheel sensitivity
      
      scrollRef.current.scrollTop = newScrollTop;
    };

    return (
      <div className="relative h-48 overflow-hidden">
        <div
          ref={scrollRef}
          className="overflow-y-auto scrollbar-hide"
          style={{ 
            height: containerHeight,
            scrollSnapType: 'y mandatory',
            scrollBehavior: 'smooth'
          }}
          onScroll={handleScroll}
          onWheel={handleWheel}
        >
          {/* Top padding to center first item */}
          <div style={{ height: centerOffset }} />
          
          <div>
            {items.map((item, index) => {
              const value = typeof item === 'number' ? item : item.value;
              const display = typeof item === 'number' ? item.toString().padStart(2, '0') : item.name;
              const isSelected = value === selectedValue;
              
              return (
                <div
                  key={index}
                  className={`flex items-center justify-center text-sm transition-all duration-200 ${
                    isSelected 
                      ? 'text-purple-600 dark:text-purple-400 font-semibold scale-110' 
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
          </div>
          
          {/* Bottom padding to center last item */}
          <div style={{ height: centerOffset }} />
        </div>
        
        {/* Selection indicator */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg pointer-events-none border border-purple-200 dark:border-purple-700" />
        
        {/* Gradient overlays for better visual effect */}
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white dark:from-gray-800 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none" />
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
        <span className={hasUserSelected || value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
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
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg z-50 p-4"
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Select Date of Birth
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Scroll to select your birth date
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Day Picker */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  Day
                </label>
                <WheelPicker
                  items={days}
                  selectedValue={selectedDate.day}
                  onValueChange={(value) => handleScroll('day', value)}
                  type="day"
                />
              </div>

              {/* Month Picker */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  Month
                </label>
                <WheelPicker
                  items={months}
                  selectedValue={selectedDate.month}
                  onValueChange={(value) => handleScroll('month', value)}
                  type="month"
                />
              </div>

              {/* Year Picker */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  Year
                </label>
                <WheelPicker
                  items={years}
                  selectedValue={selectedDate.year}
                  onValueChange={(value) => handleScroll('year', value)}
                  type="year"
                />
              </div>
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