import React, { useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { MentionAutocomplete } from './mention-autocomplete';
import { renderTextWithMentions } from './mention-renderer';
import { cn } from '@/lib/utils';

interface TextareaWithMentionsProps {
  value: string;
  onChange: (value: string) => void;
  characters: Array<{ id: string; name: string; description?: string }>;
  locations: Array<{ id: string; name: string; description?: string }>;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void;
  showMentionOverlay?: boolean; // Whether to show the blue mention overlay
  'data-testid'?: string;
}

export function TextareaWithMentions({
  value,
  onChange,
  characters,
  locations,
  placeholder,
  className,
  readOnly = false,
  onBlur,
  onScroll,
  showMentionOverlay = false,
  'data-testid': dataTestId,
}: TextareaWithMentionsProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Check if there's a selection
    const selectionStart = e.target.selectionStart;
    const selectionEnd = e.target.selectionEnd;
    setHasSelection(selectionStart !== selectionEnd);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setHasSelection(false);
    onBlur?.(e);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;
    setHasSelection(selectionStart !== selectionEnd);
  };

  const handleInsertMention = (mentionText: string, startPos: number, endPos: number) => {
    const beforeMention = value.substring(0, startPos);
    const afterMention = value.substring(endPos);
    const newValue = beforeMention + mentionText + ' ' + afterMention;
    
    onChange(newValue);
    
    // Set cursor position after the inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = startPos + mentionText.length + 1;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    onScroll?.(e);
    
    // Sync overlay scroll
    if (showMentionOverlay && value && !isFocused && !hasSelection) {
      const overlay = e.currentTarget.nextElementSibling as HTMLElement;
      if (overlay) {
        overlay.scrollTop = e.currentTarget.scrollTop;
        overlay.scrollLeft = e.currentTarget.scrollLeft;
      }
    }
  };

  // Hide overlay when focused or when text is selected
  const shouldShowOverlay = showMentionOverlay && value && !readOnly && !isFocused && !hasSelection;

  return (
    <div className="relative">
      {!readOnly && (
        <MentionAutocomplete
          value={value}
          characters={characters}
          locations={locations}
          textareaRef={textareaRef}
          onInsertMention={handleInsertMention}
        />
      )}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelect={handleSelect}
        onScroll={handleScroll}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(
          className,
          shouldShowOverlay && "text-transparent caret-white"
        )}
        data-testid={dataTestId}
      />
      {shouldShowOverlay && (
        <div
          className="absolute inset-0 pointer-events-none p-3 text-sm whitespace-pre-wrap break-words overflow-hidden"
          style={{ minHeight: '120px' }}
        >
          {renderTextWithMentions(value)}
        </div>
      )}
    </div>
  );
}

