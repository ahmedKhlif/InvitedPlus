'use client';

import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowDuplicates?: boolean;
  suggestions?: string[];
  className?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Add tags...',
  maxTags = 10,
  allowDuplicates = false,
  suggestions = [],
  className = '',
  label,
  required = false,
  error,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim() && suggestions.length > 0) {
      const filtered = suggestions.filter(
        suggestion =>
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          (allowDuplicates || !value.includes(suggestion))
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedSuggestionIndex(-1);
  }, [inputValue, suggestions, value, allowDuplicates]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    // Check for duplicates
    if (!allowDuplicates && value.includes(trimmedTag)) {
      return;
    }

    // Check max tags limit
    if (value.length >= maxTags) {
      return;
    }

    onChange([...value, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && filteredSuggestions[selectedSuggestionIndex]) {
          addTag(filteredSuggestions[selectedSuggestionIndex]);
        } else if (inputValue.trim()) {
          addTag(inputValue);
        }
        break;

      case 'Backspace':
        if (!inputValue && value.length > 0) {
          removeTag(value.length - 1);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (showSuggestions) {
          setSelectedSuggestionIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (showSuggestions) {
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;

      case 'Tab':
        if (showSuggestions && selectedSuggestionIndex >= 0) {
          e.preventDefault();
          addTag(filteredSuggestions[selectedSuggestionIndex]);
        }
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className={`tag-input ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`
          flex flex-wrap gap-2 p-3 border rounded-lg min-h-[42px] cursor-text
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          ${error ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500' : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-500'}
          focus-within:ring-1 transition-colors
        `}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Render existing tags */}
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none focus:bg-blue-200 transition-colors"
                title="Remove tag"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {/* Input field */}
        {!disabled && value.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setShowSuggestions(filteredSuggestions.length > 0)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
            disabled={disabled}
          />
        )}

        {/* Add button for mobile */}
        {!disabled && value.length < maxTags && inputValue.trim() && (
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            title="Add tag"
          >
            <PlusIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50
                ${index === selectedSuggestionIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === filteredSuggestions.length - 1 ? 'rounded-b-lg' : ''}
              `}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Helper text and error */}
      <div className="mt-1 flex justify-between text-xs">
        <div>
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : (
            <span className="text-gray-500">
              {value.length}/{maxTags} tags
            </span>
          )}
        </div>
        {!disabled && (
          <span className="text-gray-400">
            Press Enter to add • Backspace to remove
          </span>
        )}
      </div>
    </div>
  );
};

export default TagInput;
