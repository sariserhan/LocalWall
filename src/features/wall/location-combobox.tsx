import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function LocationCombobox({ value, options, onChange, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options
        .filter(
          (o) =>
            o.label.toLowerCase().startsWith(q) ||
            o.value.toLowerCase().startsWith(q) ||
            o.label.toLowerCase().includes(q),
        )
        .slice(0, 80)
    : options;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="loc-combo">
      <input
        type="text"
        className={`loc-combo-input${open ? " is-open" : ""}`}
        value={open ? query : currentLabel}
        placeholder={placeholder ?? "Type to search…"}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(""); setOpen(true); }}
        onBlur={() => { setTimeout(() => { setOpen(false); setQuery(""); }, 160); }}
      />
      <ChevronDown className={`loc-combo-arrow${open ? " is-open" : ""}`} size={14} />
      {open && (
        <ul className="loc-combo-list" onMouseDown={(e) => e.preventDefault()}>
          {filtered.map((o, i) => (
            <li
              key={`${o.value}-${i}`}
              className={`loc-combo-option${o.value === value ? " is-selected" : ""}`}
              onMouseDown={() => handleSelect(o.value)}
            >
              {o.label}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="loc-combo-option loc-combo-empty">No matches</li>
          )}
        </ul>
      )}
    </div>
  );
}
