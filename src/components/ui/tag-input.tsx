import * as React from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../stores/useAppStore';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Add tag...',
  className,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const { tags: allTags, addTag } = useAppStore();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const suggestions = allTags.filter(
    (tag) =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(tag)
  );

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      // Add to global tags if new
      if (!allTags.includes(trimmed)) {
        addTag(trimmed);
      }
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      handleRemoveTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-300 bg-white p-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="rounded-full p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[100px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || inputValue) && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddTag(tag)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {tag}
            </button>
          ))}
          {inputValue && !allTags.includes(inputValue) && (
            <button
              type="button"
              onClick={() => handleAddTag(inputValue)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-emerald-600 hover:bg-slate-100 dark:text-emerald-400 dark:hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Create "{inputValue}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};
