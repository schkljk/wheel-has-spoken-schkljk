import { Icon } from './Icon';

/** A search field with a pixel magnifier and a clear button (upgrade 30). */
export function SearchBox({ value, onInput, label, placeholder }: { value: string; onInput: (v: string) => void; label: string; placeholder?: string }) {
  return (
    <label class="fsearch">
      <Icon name="search" />
      <input type="search" class="field" aria-label={label} placeholder={placeholder ?? 'Search'} value={value} onInput={(e) => onInput((e.target as HTMLInputElement).value)} />
      {value && (
        <button class="iconbtn fs-clear" aria-label="Clear search" onClick={() => onInput('')}>
          <Icon name="close" />
        </button>
      )}
    </label>
  );
}

/** A row of toggle chips; tapping the active one clears it. The row scrolls sideways when it doesn't fit. */
export function Chips<T extends string | number>({ label, value, options, onChange }: { label: string; value: T | null; options: [T, string][]; onChange: (v: T | null) => void }) {
  return (
    <div class="fchips" role="group" aria-label={label} data-hscroll="">
      {options.map(([v, text]) => (
        <button key={String(v)} class="chip fchip" aria-pressed={value === v} onClick={() => onChange(value === v ? null : v)}>
          {text}
        </button>
      ))}
    </div>
  );
}
