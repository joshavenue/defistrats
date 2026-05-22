import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
  suggestions?: string[];
}

export const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = "Type and press Enter to add tags...",
  className,
  maxTags,
  suggestions = []
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      if (!maxTags || value.length < maxTags) {
        onChange([...value, trimmedValue]);
        setInputValue('');
        setShowSuggestions(false);
      }
    }
  };

  const addSuggestion = (suggestion: string) => {
    if (!value.includes(suggestion)) {
      if (!maxTags || value.length < maxTags) {
        onChange([...value, suggestion]);
        setInputValue('');
        setShowSuggestions(false);
      }
    }
  };

  const removeTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
  };

  const filteredSuggestions = suggestions.filter(
    suggestion => 
      !value.includes(suggestion) && 
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={cn("relative", className)}>
      <div className="w-full min-h-[48px] px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus-within:ring-2 focus-within:ring-[#75E0A7] focus-within:border-transparent flex flex-wrap gap-2 items-center">
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-[#75E0A7] text-[#0C0E12] text-sm rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:bg-[#5BC48A] rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(e.target.value.length > 0 && filteredSuggestions.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0 && filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-0 bg-transparent border-none outline-none placeholder-[#94979C] text-[#F7F7F7]"
          disabled={maxTags ? value.length >= maxTags : false}
        />
      </div>
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#0C0E12] border border-[#373A41] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addSuggestion(suggestion)}
              className="w-full px-4 py-2 text-left text-[#F7F7F7] hover:bg-[#373A41] transition-colors border-b border-[#22262F] last:border-b-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      {maxTags && (
        <div className="text-xs text-[#94979C] mt-1">
          {value.length} / {maxTags} tags
        </div>
      )}
    </div>
  );
};