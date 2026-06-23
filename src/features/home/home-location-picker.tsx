"use client";

import { useMemo, useRef, useState } from "react";
import { Country, State, City } from "country-state-city";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  country: string;
  state: string;
  city: string;
  onChange: (country: string, state: string, city: string) => void;
  loading?: boolean;
}

type Level = "country" | "state" | "city";

function filter<T extends { name: string; isoCode?: string }>(list: T[], q: string): T[] {
  if (!q) return list.slice(0, 120);
  const lower = q.toLowerCase();
  const starts = list.filter((o) => o.name.toLowerCase().startsWith(lower) || o.isoCode?.toLowerCase().startsWith(lower));
  const contains = list.filter((o) => !o.name.toLowerCase().startsWith(lower) && o.name.toLowerCase().includes(lower));
  return [...starts, ...contains].slice(0, 80);
}

export function HomeLocationPicker({ country, state, city, onChange, loading }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Level>("country");
  const inputRef = useRef<HTMLInputElement>(null);

  const allCountries = useMemo(() => Country.getAllCountries(), []);
  const statesForCountry = useMemo(() => (country ? State.getStatesOfCountry(country) : []), [country]);
  const citiesForState = useMemo(() => (country && state ? City.getCitiesOfState(country, state) : []), [country, state]);

  const hasStates = statesForCountry.length > 0;
  const hasCities = citiesForState.length > 0;

  const countryName = useMemo(() => allCountries.find((c) => c.isoCode === country)?.name ?? country, [allCountries, country]);
  const stateName = useMemo(() => statesForCountry.find((s) => s.isoCode === state)?.name ?? state, [statesForCountry, state]);

  const options = useMemo(() => {
    if (level === "country") return filter(allCountries, query);
    if (level === "state") return filter(statesForCountry, query);
    return filter(citiesForState.map((c) => ({ name: c.name })), query);
  }, [level, query, allCountries, statesForCountry, citiesForState]);

  const displayValue = open
    ? query
    : [countryName, stateName, city].filter(Boolean).join(" › ");

  const openAt = (l: Level) => {
    setLevel(l);
    setQuery("");
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleFocus = () => {
    if (!open) {
      setQuery("");
      setLevel("country");
      setOpen(true);
    }
  };

  const selectCountry = (iso: string) => {
    const nextHasStates = State.getStatesOfCountry(iso).length > 0;
    onChange(iso, "", "");
    setQuery("");
    if (nextHasStates) setLevel("state");
    else setOpen(false);
  };

  const selectState = (iso: string) => {
    const nextHasCities = iso ? City.getCitiesOfState(country, iso).length > 0 : false;
    onChange(country, iso, "");
    setQuery("");
    if (iso === "") { setOpen(false); return; }
    if (nextHasCities) setLevel("city");
    else setOpen(false);
  };

  const selectCity = (name: string) => {
    onChange(country, state, name);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="hlp">
      <input
        ref={inputRef}
        className="home-search-input hlp-input"
        type="text"
        value={displayValue}
        placeholder={loading ? "Detecting…" : "Country, state, city…"}
        onChange={(e) => { setQuery(e.target.value); setLevel("country"); if (!open) setOpen(true); }}
        onFocus={handleFocus}
        onClick={handleFocus}
        onBlur={() => setTimeout(() => { setOpen(false); setQuery(""); }, 160)}
        autoComplete="off"
        aria-label="Location"
        aria-expanded={open}
      />
      <ChevronDown
        size={13}
        className={`hlp-chevron${open ? " open" : ""}`}
        onMouseDown={(e) => {
          e.preventDefault();
          if (open) { setOpen(false); setQuery(""); }
          else inputRef.current?.focus();
        }}
      />

      {open && (
        <div className="hlp-dropdown" onMouseDown={(e) => e.preventDefault()}>
          <div className="hlp-breadcrumb">
            <button
              type="button"
              className={`hlp-crumb${level === "country" ? " active" : ""}`}
              onMouseDown={() => openAt("country")}
            >
              {countryName || "Country"}
            </button>
            {country && hasStates && (
              <>
                <ChevronRight size={9} className="hlp-sep" />
                <button
                  type="button"
                  className={`hlp-crumb${level === "state" ? " active" : ""}`}
                  onMouseDown={() => openAt("state")}
                >
                  {stateName || "State"}
                </button>
              </>
            )}
            {state && hasCities && (
              <>
                <ChevronRight size={9} className="hlp-sep" />
                <button
                  type="button"
                  className={`hlp-crumb${level === "city" ? " active" : ""}`}
                  onMouseDown={() => openAt("city")}
                >
                  {city || "City"}
                </button>
              </>
            )}
          </div>

          <ul className="hlp-list">
            {level === "state" && (
              <li className="hlp-option hlp-all" onMouseDown={() => { onChange(country, "", ""); setOpen(false); }}>
                All of {countryName}
              </li>
            )}
            {level === "city" && (
              <li className="hlp-option hlp-all" onMouseDown={() => { onChange(country, state, ""); setOpen(false); }}>
                All of {stateName || countryName}
              </li>
            )}
            {(options as Array<{ name: string; isoCode?: string }>).map((opt, i) => (
              <li
                key={`${opt.isoCode ?? opt.name}-${i}`}
                className={`hlp-option${
                  (level === "country" && opt.isoCode === country) ||
                  (level === "state" && opt.isoCode === state) ||
                  (level === "city" && opt.name === city)
                    ? " selected"
                    : ""
                }`}
                onMouseDown={() => {
                  if (level === "country") selectCountry(opt.isoCode ?? "");
                  else if (level === "state") selectState(opt.isoCode ?? "");
                  else selectCity(opt.name);
                }}
              >
                {opt.name}
                {level === "country" && opt.isoCode ? <span className="hlp-iso">{opt.isoCode}</span> : null}
              </li>
            ))}
            {options.length === 0 && <li className="hlp-option hlp-empty">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
