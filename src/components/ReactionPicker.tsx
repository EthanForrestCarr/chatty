import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

export default function ReactionPicker({ onSelect }: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const togglePicker = () => {
    if (!showPicker && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setShowPicker((prev) => !prev);
  };

  // close on outside click (ignoring clicks inside button or picker)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showPicker &&
        buttonRef.current &&
        pickerRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showPicker]);

  return (
    <div className="inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePicker}
        className="text-xl p-1 rounded hover:bg-gray-200"
      >
        😊
      </button>
      {showPicker &&
        createPortal(
          <div
            ref={pickerRef}
            className="z-50"
            style={{ position: 'absolute', top: position.top, left: position.left }}
          >
            <EmojiPicker
              onEmojiClick={(emojiData: EmojiClickData) => {
                onSelect(emojiData.emoji);
                setShowPicker(false);
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
