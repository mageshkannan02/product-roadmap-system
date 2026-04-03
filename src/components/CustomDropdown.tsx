import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  colorClass?: string;
}

interface CustomDropdownProps {
  value?: string;
  onChange?: (value: string) => void;
  options: DropdownOption[];
  className?: string;
  wrapperClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  prefixIcon?: React.ReactNode;
  // Multi-select props
  isMulti?: boolean;
  selectedValues?: string[];
  onMultiChange?: (values: string[]) => void;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  className,
  wrapperClassName = 'w-full',
  placeholder = 'Select...',
  disabled = false,
  prefixIcon,
  isMulti = false,
  selectedValues = [],
  onMultiChange
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, isAbove: false });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        (!menuRef.current || !menuRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', () => setIsOpen(false), { passive: true });
      window.addEventListener('resize', () => setIsOpen(false), { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', () => setIsOpen(false));
      window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < 250; // If less than 250px space below, open upwards

      setCoords({
        top: showAbove ? rect.top + window.scrollY : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        isAbove: showAbove
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const isSelected = (val: string) => {
    if (isMulti) return selectedValues.includes(val);
    return value === val;
  };

  const handleSelect = (optionValue: string) => {
    if (isMulti && onMultiChange) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onMultiChange(newValues);
    } else if (onChange) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (isMulti) {
      if (selectedValues.length === 0) return placeholder;
      if (selectedValues.length === 1) {
        const opt = options.find(o => o.value === selectedValues[0]);
        return opt ? opt.label : placeholder;
      }
      if (selectedValues.length <= 2) {
        return selectedValues.map(v => options.find(o => o.value === v)?.label).join(', ');
      }
      return `${selectedValues.length} Selected`;
    }

    const selectedOption = options.find(o => o.value === value);
    return selectedOption ? selectedOption.label : placeholder;
  };

  const menu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: coords.isAbove ? 10 : -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: coords.isAbove ? 10 : -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{ 
            top: coords.top + (coords.isAbove ? -4 : 4), 
            left: coords.left, 
            minWidth: Math.max(160, coords.width),
            translateY: coords.isAbove ? '-100%' : '0'
          }}
          className="absolute z-9999 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 overflow-hidden ring-1 ring-black/5"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(option.value);
              }}
              className={cn(
                "flex items-center justify-between w-full px-4 py-2 hover:bg-slate-50 transition-colors text-left text-sm group cursor-pointer",
                isSelected(option.value) && "bg-indigo-50/30"
              )}
            >
              <div className="flex items-center gap-2">
                {option.icon && <div className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">{option.icon}</div>}
                <span className={cn("font-medium transition-colors", 
                  isSelected(option.value) ? "text-indigo-700" : option.colorClass || "text-gray-700 group-hover:text-gray-900"
                )}>
                  {option.label}
                </span>
              </div>
              {isSelected(option.value) && (
                <Check className="w-4 h-4 text-indigo-600 ml-4 shrink-0" />
              )}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn("relative inline-block", wrapperClassName)} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-50/80 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {prefixIcon ? (
            <div className="shrink-0">{prefixIcon}</div>
          ) : (
            !isMulti && options.find(o => o.value === value)?.icon && (
              <div className="shrink-0 opacity-70">{options.find(o => o.value === value)?.icon}</div>
            )
          )}
          <span className={cn(
            !isMulti && options.find(o => o.value === value)?.colorClass,
            ((isMulti && selectedValues.length === 0) || (!isMulti && !value)) && "text-gray-400"
          )}>
            {getDisplayText()}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
      </button>

      {/* Render the dropdown via portal to body to overlay any container holding overflow constraints */}
      {typeof document !== 'undefined' ? createPortal(menu, document.body) : null}
    </div>
  );
}
