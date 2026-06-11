'use client';

import { useEffect, useRef } from 'react';

interface WaveTextProps {
  text: string;
  className?: string;
}

export function WaveText({ text, className = '' }: WaveTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lines = text.split('<br>');
    container.innerHTML = '';

    lines.forEach((line, lineIdx) => {
      const words = line.trim().split(' ');
      const lineSpan = document.createElement('span');
      lineSpan.style.display = 'inline-block';
      lineSpan.style.whiteSpace = 'nowrap';

      words.forEach((word, wordIdx) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';

        [...word].forEach((char, charIdx) => {
          const charSpan = document.createElement('span');
          charSpan.textContent = char;
          charSpan.className = 'wave-char';
          const delay = lineIdx * 0.5 + wordIdx * 0.1 + charIdx * 0.05;
          charSpan.style.animationDelay = `${delay}s`;
          wordSpan.appendChild(charSpan);
        });

        lineSpan.appendChild(wordSpan);
        if (wordIdx < words.length - 1) {
          lineSpan.appendChild(document.createTextNode('\u00A0'));
        }
      });

      container.appendChild(lineSpan);
      if (lineIdx < lines.length - 1) {
        container.appendChild(document.createElement('br'));
      }
    });
  }, [text]);

  return (
    <h1 className={className} ref={containerRef}>
      {text}
    </h1>
  );
}
