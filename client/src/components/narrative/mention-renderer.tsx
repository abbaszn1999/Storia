import React from 'react';

/**
 * Renders text with @mentions styled in blue
 * @param text - Text that may contain @mentions
 * @returns React element with styled mentions
 */
export function renderTextWithMentions(text: string): React.ReactNode {
  if (!text) return text;

  // Regex to match @mentions (e.g., @The Wolf, @Dark Wood, @Little Red Riding Hood)
  // The key is to match word characters and spaces, but stop when we encounter:
  // 1. A space followed by a lowercase letter (next word is not part of mention)
  // 2. Punctuation marks
  // 3. End of string
  // 
  // Pattern breakdown:
  // @ - the @ symbol
  // ([A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*)*) - matches capitalized words with spaces
  //   - First word must start with capital letter
  //   - Subsequent words (after space) must also start with capital letter
  //   - This ensures we stop at "standing" after "@Little Red Riding Hood"
  // (?=\s|$|[.,!?;:)]) - lookahead to ensure we stop at space, punctuation, or end
  //
  // However, this might be too restrictive. Let's use a simpler approach:
  // Match @ followed by word characters and spaces, but use word boundary to stop
  const mentionRegex = /@[A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*)*(?=\s+[a-z]|\s|$|[.,!?;:)])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the styled mention (include the @ symbol)
    parts.push(
      <span
        key={`mention-${keyIndex++}`}
        className="bg-blue-500/20 text-blue-300 px-1 rounded"
      >
        {match[0]}
      </span>
    );

    lastIndex = mentionRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}











