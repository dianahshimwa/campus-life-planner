export function highlightMatches(text, regex) {
  if (!regex || !text) return text;

  try {
    const parts = [];
    let lastIndex = 0;
    let match;

    const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');

    while ((match = globalRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(escapeHtml(text.substring(lastIndex, match.index)));
      }

      parts.push(`<mark>${escapeHtml(match[0])}</mark>`);
      lastIndex = match.index + match[0].length;

      if (match.index === globalRegex.lastIndex) {
        globalRegex.lastIndex++;
      }
    }

    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts.join('') : escapeHtml(text);
  } catch (error) {
    return escapeHtml(text);
  }
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function testRegexPattern(pattern, caseSensitive = false) {
  try {
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);
    return { valid: true, regex };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export const searchExamples = [
  {
    pattern: '^@homework',
    description: 'Tasks starting with @homework'
  },
  {
    pattern: 'study|review',
    description: 'Tasks containing "study" OR "review"'
  },
  {
    pattern: '\\d{2}:\\d{2}',
    description: 'Tasks with time patterns (14:30)'
  },
  {
    pattern: '\\b(\\w+)\\s+\\1\\b',
    description: 'Detect duplicate words (back-reference)'
  },
  {
    pattern: '(?=.*exam)(?=.*math)',
    description: 'Tasks with both "exam" AND "math" (lookahead)'
  }
];
