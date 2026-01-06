import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { User, MapPin } from 'lucide-react';

interface Mentionable {
  id: string;
  name: string;
  type: 'character' | 'location';
}

interface MentionAutocompleteProps {
  value: string;
  characters: Array<{ id: string; name: string; description?: string }>;
  locations: Array<{ id: string; name: string; description?: string }>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInsertMention: (mentionText: string, startPos: number, endPos: number) => void;
}

export function MentionAutocomplete({
  value,
  characters,
  locations,
  textareaRef,
  onInsertMention,
}: MentionAutocompleteProps) {
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Combine characters and locations into mentionables
  const mentionables: Mentionable[] = [
    ...characters.map(c => ({ id: c.id, name: c.name, type: 'character' as const })),
    ...locations.map(l => ({ id: l.id, name: l.name, type: 'location' as const })),
  ];

  // Filter mentionables based on query
  const filteredMentionables = mentionables.filter(item =>
    item.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Detect @ mentions in the text
  const detectMention = useCallback((text: string, cursorPos: number) => {
    // Find the @ symbol before the cursor
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) {
      return null;
    }

    // Check if there's a space or newline between @ and cursor (mention is complete)
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
    if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
      return null;
    }

    // Extract the query (text after @)
    const query = textAfterAt.trim();
    
    return {
      start: lastAtIndex,
      end: cursorPos,
      query,
    };
  }, []);

  // Check for mentions when value or cursor position changes
  useEffect(() => {
    if (!textareaRef?.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const mention = detectMention(value, cursorPos);
    
    if (mention) {
      setMentionQuery(mention.query);
      setMentionPosition({ start: mention.start, end: mention.end });
      setIsOpen(true);
      setSelectedIndex(0);
    } else {
      setIsOpen(false);
      setMentionPosition(null);
      setMentionQuery('');
    }
  }, [value, detectMention, textareaRef]);

  // Insert mention into text
  const insertMention = useCallback((mentionable: Mentionable) => {
    if (!mentionPosition || !textareaRef?.current) return;
    
    const mentionText = `@${mentionable.name}`;
    onInsertMention(mentionText, mentionPosition.start, mentionPosition.end);
    setIsOpen(false);
    setMentionPosition(null);
    setMentionQuery('');
  }, [mentionPosition, textareaRef, onInsertMention]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || filteredMentionables.length === 0 || !textareaRef?.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if dropdown is open
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev + 1) % filteredMentionables.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev - 1 + filteredMentionables.length) % filteredMentionables.length);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        insertMention(filteredMentionables[selectedIndex]);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        insertMention(filteredMentionables[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setMentionPosition(null);
        setMentionQuery('');
      }
    };

    const textarea = textareaRef.current;
    textarea.addEventListener('keydown', handleKeyDown, true);
    return () => {
      textarea.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, filteredMentionables, selectedIndex, textareaRef, insertMention]);

  // Calculate popover position
  const getPopoverPosition = () => {
    if (!textareaRef?.current || !mentionPosition) return { top: 0, left: 0 };
    
    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    
    // Approximate position based on cursor
    // This is a simplified version - could be improved with better text measurement
    const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 20;
    const paddingTop = parseFloat(window.getComputedStyle(textarea).paddingTop) || 12;
    
    // Count lines before cursor
    const textBeforeCursor = value.substring(0, mentionPosition.start);
    const lines = textBeforeCursor.split('\n');
    const lineNumber = lines.length - 1;
    
    return {
      top: rect.top + paddingTop + (lineNumber * lineHeight) + lineHeight + 5,
      left: rect.left + 12,
    };
  };

  const popoverStyle = mentionPosition ? getPopoverPosition() : { top: 0, left: 0 };

  if (!isOpen || filteredMentionables.length === 0) {
    return null;
  }

  return (
    <Popover open={true}>
      <PopoverContent
        className="w-[300px] p-0 bg-[#1a2332] border-white/10"
        style={{
          position: 'fixed',
          top: `${popoverStyle.top}px`,
          left: `${popoverStyle.left}px`,
          zIndex: 1000,
        }}
      >
        <Command className="bg-transparent">
          <CommandList>
            <CommandGroup>
              {filteredMentionables.map((item, index) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => insertMention(item)}
                  className={cn(
                    "cursor-pointer text-white/70 hover:bg-white/10",
                    index === selectedIndex && "bg-white/10"
                  )}
                >
                  {item.type === 'character' ? (
                    <User className="mr-2 h-4 w-4 text-blue-400" />
                  ) : (
                    <MapPin className="mr-2 h-4 w-4 text-green-400" />
                  )}
                  <span>{item.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
