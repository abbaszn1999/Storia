import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { User, MapPin } from "lucide-react";
import { renderTextWithMentions } from "./mention-renderer";

interface MentionItem {
  id: string;
  name: string;
  description?: string;
  type: 'character' | 'location';
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  characters: Array<{ id: string; name: string; description?: string }>;
  locations: Array<{ id: string; name: string; description?: string }>;
  onBlur?: () => void;
  readOnly?: boolean;
  'data-testid'?: string;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  className,
  characters,
  locations,
  onBlur,
  readOnly = false,
  'data-testid': dataTestId,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);

  // Combine characters and locations for mention list
  const mentionItems: MentionItem[] = useMemo(() => {
    const chars = characters.map(c => ({ ...c, type: 'character' as const }));
    const locs = locations.map(l => ({ ...l, type: 'location' as const }));
    const items = [...chars, ...locs];
    // Debug log
    if (items.length === 0) {
      console.warn('[MentionTextarea] No characters or locations available for mentions');
    }
    return items;
  }, [characters, locations]);

  // Filter mentions based on query
  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return mentionItems;
    const query = mentionQuery.toLowerCase();
    return mentionItems.filter(item => 
      item.name.toLowerCase().includes(query)
    );
  }, [mentionQuery, mentionItems]);

  // Handle text change and detect @ mentions
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly) return; // Don't process changes if read-only
    
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    const selectionEnd = e.target.selectionEnd;
    setCursorPosition(cursorPos);
    setHasSelection(cursorPos !== selectionEnd);
    
    onChange(newValue);

    // Find @ mention at cursor position
    // Match @ followed by word characters and spaces (for multi-word names)
    // Stop at punctuation, newline, or when followed by another @
    const textBeforeCursor = newValue.substring(0, cursorPos);
    
    // Match @ followed by word characters and spaces until we hit punctuation, newline, or end
    // Look backwards from cursor to find the @ symbol
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      // Check if there's a space or newline between @ and cursor (if so, not a mention)
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.match(/[\s\n]/)) {
        // This is a mention - extract the query
        const query = textAfterAt.trim();
        setMentionQuery(query);
      
        // Calculate position for dropdown (using fixed positioning like narrative mode)
        const textarea = e.target;
        const textBeforeMention = textBeforeCursor.substring(0, lastAtIndex);
        
        // Create a temporary span to measure text width
        const measureSpan = document.createElement('span');
        measureSpan.style.visibility = 'hidden';
        measureSpan.style.position = 'absolute';
        measureSpan.style.whiteSpace = 'pre-wrap';
        measureSpan.style.font = window.getComputedStyle(textarea).font;
        measureSpan.style.width = `${textarea.offsetWidth}px`;
        measureSpan.textContent = textBeforeMention;
        document.body.appendChild(measureSpan);
        
        const rect = textarea.getBoundingClientRect();
        const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 20;
        const paddingTop = parseFloat(window.getComputedStyle(textarea).paddingTop) || 12;
        
        // Count lines before cursor (for fixed positioning, we use viewport coordinates)
        const lines = (textBeforeMention.match(/\n/g) || []).length;
        
        setMentionPosition({
          top: rect.top + paddingTop + (lines * lineHeight) + lineHeight + 5,
          left: rect.left + measureSpan.offsetWidth + 10,
        });
        
        document.body.removeChild(measureSpan);
        
        setShowMentions(true);
        setSelectedIndex(0);
      } else {
        setShowMentions(false);
        setMentionQuery('');
      }
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }

    // Auto-resize
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.max(target.scrollHeight, 50)}px`;
  }, [onChange, characters, locations, readOnly]);

  // Handle mention selection
  const insertMention = useCallback((item: MentionItem) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = cursorPosition;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    
    // Find the @ mention to replace - look for last @ before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Only replace if there's no space/newline between @ and cursor
      if (!textAfterAt.match(/[\s\n]/)) {
        const startPos = lastAtIndex;
        // Check if there's already a space after cursor, if not add one
        const charAfter = value.substring(cursorPos, cursorPos + 1);
        const needsSpace = charAfter && charAfter !== ' ' && charAfter !== '\n';
        const newText = 
          value.substring(0, startPos) + 
          `@${item.name}${needsSpace ? ' ' : ''}` + 
          value.substring(cursorPos);
        
        onChange(newText);
        
        // Set cursor position after the mention
        setTimeout(() => {
          const newCursorPos = startPos + item.name.length + 1 + (needsSpace ? 1 : 0);
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
      }
    }
    
    setShowMentions(false);
    setMentionQuery('');
  }, [value, cursorPosition, onChange]);

  // Handle keyboard navigation in mentions dropdown
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredMentions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMentions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  }, [showMentions, filteredMentions, selectedIndex, insertMention]);

  // Hide overlay when focused or when text is selected
  const shouldShowOverlay = value && !isFocused && !hasSelection;

  return (
    <div className="relative w-full">
      {/* Regular textarea with visible text */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          setHasSelection(false);
          // Delay hiding to allow click on mention item
          setTimeout(() => setShowMentions(false), 200);
          onBlur?.();
        }}
        onSelect={(e) => {
          const target = e.target as HTMLTextAreaElement;
          const selectionStart = target.selectionStart;
          const selectionEnd = target.selectionEnd;
          setHasSelection(selectionStart !== selectionEnd);
        }}
        onScroll={(e) => {
          // Sync overlay scroll
          if (shouldShowOverlay) {
            const overlay = e.currentTarget.nextElementSibling as HTMLElement;
            if (overlay) {
              overlay.scrollTop = e.currentTarget.scrollTop;
              overlay.scrollLeft = e.currentTarget.scrollLeft;
            }
          }
        }}
        placeholder={placeholder}
        rows={4}
        readOnly={readOnly}
        data-testid={dataTestId}
        className={cn(
          className,
          "w-full bg-white/5 border-white/10 text-white text-xs resize-none",
          "focus:outline-none focus:ring-2 focus:ring-white/20 rounded-md px-3 py-2",
          "placeholder:text-white/40",
          shouldShowOverlay && "text-transparent caret-white",
          readOnly && "cursor-not-allowed"
        )}
        style={{
          width: '100%',
          minWidth: '100%',
        }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = `${Math.max(target.scrollHeight, 80)}px`;
        }}
      />
      
      {/* Mentions Dropdown - Use fixed positioning like narrative mode */}
      {!readOnly && showMentions && filteredMentions.length > 0 && (
        <div
          className="fixed z-[9999] bg-[#1a1a1a] border border-white/20 rounded-lg shadow-lg max-h-[200px] overflow-y-auto"
          style={{
            top: `${mentionPosition.top}px`,
            left: `${mentionPosition.left}px`,
            minWidth: '200px',
          }}
        >
          {filteredMentions.map((item, index) => (
            <div
              key={`${item.type}-${item.id}`}
              className={cn(
                "px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-white/10",
                index === selectedIndex && "bg-white/10"
              )}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent textarea blur
                insertMention(item);
              }}
            >
              {item.type === 'character' ? (
                <User className="w-4 h-4 text-blue-400" />
              ) : (
                <MapPin className="w-4 h-4 text-green-400" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium">{item.name}</div>
                {item.description && (
                  <div className="text-xs text-white/50 truncate">{item.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Mention Highlight Overlay - shows highlighted mentions when not focused */}
      {shouldShowOverlay && (
        <div
          className="absolute inset-0 pointer-events-none px-3 py-2 text-xs whitespace-pre-wrap break-words overflow-hidden"
          style={{
            minHeight: '80px',
            color: 'rgb(255, 255, 255)', // Base text color (white)
          }}
        >
          {renderTextWithMentions(value)}
        </div>
      )}
    </div>
  );
}

