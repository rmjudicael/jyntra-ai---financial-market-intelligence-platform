import React from 'react';

interface CleanMessageRendererProps {
  content: string;
  isAi?: boolean;
}

export const CleanMessageRenderer: React.FC<CleanMessageRendererProps> = ({ content, isAi = false }) => {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');

  // Process text line by line
  const renderedElements: React.ReactNode[] = [];

  let currentList: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={`${keyPrefix}-list`} className="space-y-1.5 my-2 pl-1">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
              <span>{renderFormattedInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const renderFormattedInline = (text: string): React.ReactNode => {
    // Clean remaining raw formatting residues
    let clean = text.trim();

    // Replace bold **text** or __text__ with clean tokens
    // We split by regex and format
    const parts = clean.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);

    return parts.map((part, index) => {
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        const inner = part.slice(2, -2).trim();
        return (
          <strong key={index} className="font-semibold text-white">
            {inner}
          </strong>
        );
      }
      // Single asterisks or backticks cleanup
      const cleanedPart = part.replace(/[*_`]/g, '');
      return <span key={index}>{cleanedPart}</span>;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(`flush-${index}`);
      return;
    }

    // Check for Headings: #, ##, ###
    if (trimmed.startsWith('#')) {
      flushList(`h-flush-${index}`);
      const headingText = trimmed.replace(/^#+\s*/, '');
      renderedElements.push(
        <h4 key={`heading-${index}`} className="font-bold text-sm text-cyan-300 mt-3 mb-1 tracking-wide flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-cyan-400 inline-block" />
          {renderFormattedInline(headingText)}
        </h4>
      );
      return;
    }

    // Check for Bullet items: -, *, •, or number list 1.
    if (/^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
      currentList.push(itemText);
      return;
    }

    // Regular paragraph line
    flushList(`p-flush-${index}`);
    renderedElements.push(
      <p key={`p-${index}`} className="text-xs text-slate-200 leading-relaxed my-1.5">
        {renderFormattedInline(trimmed)}
      </p>
    );
  });

  flushList('final-flush');

  return <div className="space-y-1">{renderedElements}</div>;
};
