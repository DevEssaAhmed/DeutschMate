"use client";

const CHARS = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"] as const;

export function UmlautBar({
  onInsert,
  className = "",
}: {
  onInsert: (char: string) => void;
  className?: string;
}) {
  return (
    <div className={`umlaut-bar ${className}`.trim()} role="toolbar" aria-label="Special German characters">
      <span className="umlaut-label" aria-hidden="true">Umlaut:</span>
      <div className="umlaut-buttons">
        {CHARS.map((char) => (
          <button
            key={char}
            type="button"
            className="umlaut-btn"
            onClick={(e) => {
              e.preventDefault();
              onInsert(char);
            }}
            aria-label={`Insert ${char}`}
          >
            {char}
          </button>
        ))}
      </div>
    </div>
  );
}
