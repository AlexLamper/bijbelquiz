'use client';

import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { cleanRoomCode, extractRoomCode, ROOM_CODE_LENGTH } from './room-code';

export { ROOM_CODE_LENGTH };

interface CodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

/**
 * Six boxes for the room code. Typing moves to the next box, Backspace back,
 * the arrow keys move, and a paste (of the code or the whole invite message)
 * fills all of them.
 */
export function CodeInput({ value, onChange, onComplete, disabled, invalid }: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const chars = Array.from({ length: ROOM_CODE_LENGTH }, (_, index) => value[index] ?? '');

  const focusBox = (index: number) => {
    const clamped = Math.max(0, Math.min(ROOM_CODE_LENGTH - 1, index));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  };

  const commit = (next: string, focusIndex: number) => {
    const code = next.slice(0, ROOM_CODE_LENGTH);
    onChange(code);
    if (code.length === ROOM_CODE_LENGTH) {
      onComplete?.(code);
    } else {
      focusBox(focusIndex);
    }
  };

  const handleInput = (index: number, raw: string) => {
    const typed = cleanRoomCode(raw);
    if (!typed) return;
    // Several characters at once (autofill, a phone keyboard suggestion):
    // spread them from this box on.
    const next = value.slice(0, index) + typed + value.slice(index + typed.length);
    commit(next, index + typed.length);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (chars[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
        focusBox(index);
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index));
        focusBox(index - 1);
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusBox(index + 1);
    } else if (event.key === 'Enter' && value.length === ROOM_CODE_LENGTH) {
      onComplete?.(value);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const code = extractRoomCode(event.clipboardData.getData('text'));
    if (!code) return;
    event.preventDefault();
    commit(code, code.length);
  };

  // The box that takes the next character: the first empty one.
  const nextIndex = Math.min(value.length, ROOM_CODE_LENGTH - 1);

  return (
    <div role="group" aria-label={`Kamercode, ${ROOM_CODE_LENGTH} tekens`} className="grid grid-cols-6 gap-2">
      {chars.map((char, index) => {
        const isActive = focused === index;
        const filled = Boolean(char);
        return (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            aria-label={`Teken ${index + 1} van ${ROOM_CODE_LENGTH}`}
            aria-invalid={invalid || undefined}
            value={char}
            disabled={disabled}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            autoCorrect="off"
            spellCheck={false}
            maxLength={ROOM_CODE_LENGTH}
            onFocus={(event) => {
              // Always type into the first empty box, so a tap anywhere in the
              // row continues the code instead of leaving a gap.
              if (!char && index > nextIndex) {
                focusBox(nextIndex);
                return;
              }
              setFocused(index);
              event.currentTarget.select();
            }}
            onBlur={() => setFocused((current) => (current === index ? null : current))}
            onChange={(event) => handleInput(index, event.target.value.replace(char, '') || event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className={cn(
              'h-[60px] w-full min-w-0 rounded-[12px] p-0 text-center text-2xl font-extrabold uppercase text-ink outline-none transition-colors',
              isActive
                ? 'border-2 border-lapis bg-card'
                : filled
                  ? 'border border-b-[3px] border-line bg-card'
                  : 'border border-b-[3px] border-line bg-chip',
              invalid && !isActive && 'border-coral-line',
              disabled && 'opacity-60',
            )}
          />
        );
      })}
    </div>
  );
}
