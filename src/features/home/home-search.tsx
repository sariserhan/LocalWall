"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Country, State } from "country-state-city";
import { ChevronDown, Crosshair, LocateFixed, Loader2, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { buildWallPath } from "@/lib/wall-slug";
import { categories } from "@/features/wall/types";
import { HomeLocationPicker } from "./home-location-picker";

type DetectedLoc = {
  country: string;
  state: string;
  city: string;
  label: string;
  precise?: boolean;
};

type ResolvedLoc = { country: string; state: string; city: string };

const CACHE_KEY = "wall-ip-location-v2";

function makeLabel(city: string, stateCode: string): string {
  return [city, stateCode].filter(Boolean).join(", ");
}

async function resolveIpLocation(): Promise<ResolvedLoc | null> {
  try {
    const cached = window.sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const entry = JSON.parse(cached) as { expiresAt: number; data: ResolvedLoc };
      if (entry.expiresAt > Date.now()) return entry.data;
    }

    const ipData = (await fetch("https://ipapi.co/json/").then((r) => r.json())) as Record<string, unknown>;
    const countryCode = String(ipData.country_code ?? "US").toUpperCase();
    const regionCode = String(ipData.region_code ?? "").trim();
    const cityNameRaw = String(ipData.city ?? "").trim();

    const res = await fetch("/api/location/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode, regionCode, cityNameRaw }),
    });
    const resolved = (await res.json()) as ResolvedLoc;

    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ expiresAt: Date.now() + 30 * 60 * 1000, data: resolved }),
    );
    return resolved;
  } catch {
    return null;
  }
}

export function HomeSearch() {
  const router = useRouter();
  const recordSearch = useMutation(api.cards.recordSearch);
  const stats = useQuery(api.cards.getStats);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [detectedLoc, setDetectedLoc] = useState<DetectedLoc | null>(null);
  const [detectingOnLoad, setDetectingOnLoad] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [isPreciseLocating, setIsPreciseLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const locationDisplayLabel = useMemo(() => {
    if (selectedCity) return selectedCity;
    if (selectedState) return State.getStatesOfCountry(selectedCountry).find((s) => s.isoCode === selectedState)?.name ?? selectedState;
    return Country.getAllCountries().find((c) => c.isoCode === selectedCountry)?.name ?? selectedCountry;
  }, [selectedCountry, selectedState, selectedCity]);

  useEffect(() => {
    resolveIpLocation()
      .then((loc) => {
        if (loc) {
          const label = makeLabel(loc.city, loc.state);
          setDetectedLoc({ ...loc, label });
          setSelectedCountry(loc.country);
          setSelectedState(loc.state);
          setSelectedCity(loc.city);
        }
      })
      .finally(() => setDetectingOnLoad(false));
  }, []);

  const nearbyCards = useQuery(
    api.cards.listPublished,
    selectedCountry && !detectingOnLoad
      ? { country: selectedCountry, state: selectedState, city: selectedCity }
      : "skip",
  );

  const handleFindNearMe = async () => {
    setIsLocating(true);
    setLocationError(null);
    let loc = detectedLoc;
    if (!loc) {
      const resolved = await resolveIpLocation();
      if (resolved) {
        const label = makeLabel(resolved.city, resolved.state);
        loc = { ...resolved, label };
        setDetectedLoc(loc);
        setSelectedCountry(resolved.country);
        setSelectedState(resolved.state);
        setSelectedCity(resolved.city);
      }
    }
    setIsLocating(false);
    if (!loc) {
      setLocationError("Could not detect your location. Please select it below.");
      return;
    }
    sessionStorage.setItem("wall-visit-skip", "1");
    router.push(buildWallPath(loc.country, loc.state, loc.city, category !== "All" ? category : undefined));
  };

  const handlePreciseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Precise location is not supported by your browser.");
      return;
    }
    setIsPreciseLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(`/api/location/from-coords?lat=${lat}&lon=${lon}`);
          const data = (await res.json()) as ResolvedLoc | null;
          if (!data) throw new Error("No location found");
          const label = makeLabel(data.city, data.state);
          setDetectedLoc({ ...data, label, precise: true });
          setSelectedCountry(data.country);
          setSelectedState(data.state);
          setSelectedCity(data.city);
        } catch {
          setLocationError("Could not resolve your precise location.");
        } finally {
          setIsPreciseLocating(false);
        }
      },
      () => {
        setLocationError("Location permission denied.");
        setIsPreciseLocating(false);
      },
      { timeout: 10000 },
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const kw = keyword.trim();
    const country = selectedCountry || "US";
    const state = selectedState;
    const city = selectedCity;

    void recordSearch({ keyword: kw || undefined, category: category !== "All" ? category : undefined, country, state, city }).catch(() => {});
    const path = buildWallPath(country, state, city, category !== "All" ? category : undefined);
    const qs = kw ? `?keyword=${encodeURIComponent(kw)}` : "";
    sessionStorage.setItem("wall-visit-skip", "1");
    router.push(`${path}${qs}`);
  };

  return (
    <div className="home-search">
      <div className="home-hero-actions">
        <button
          className="primary home-hero-btn"
          onClick={() => void handleFindNearMe()}
          disabled={isLocating || detectingOnLoad}
        >
          {isLocating ? <Loader2 size={18} className="locate-spin" /> : <MapPin size={18} />}
          Find ads near me
        </button>
        <button
          className="home-hero-btn-outline"
          onClick={() => {
            const path = buildWallPath(selectedCountry, selectedState, selectedCity);
            sessionStorage.setItem("wall-visit-skip", "1");
            router.push(path);
          }}
        >
          Post for free
        </button>
      </div>

      <form className="home-search-form" onSubmit={(e) => void handleSearch(e)}>
        <div className="home-search-field">
          <span className="home-search-label">Keyword</span>
          <input
            type="text"
            className="home-search-input"
            placeholder="Plumber, couch, tutor..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            aria-label="Keyword"
          />
        </div>
        <div className="home-search-field">
          <span className="home-search-label">Category</span>
          <div className="home-select-wrap">
            <select
              className="home-search-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Category"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>
              ))}
            </select>
            <ChevronDown className="home-select-chevron" />
          </div>
        </div>
        <div className="home-search-field home-search-field-location">
          <span className="home-search-label">
            Location
            {detectingOnLoad ? <Loader2 size={9} className="locate-spin" style={{ marginLeft: 4 }} /> : null}
            <button
              type="button"
              className="home-search-locate-btn"
              onClick={handlePreciseLocation}
              disabled={isPreciseLocating || detectingOnLoad}
              title="Use my location"
            >
              {isPreciseLocating ? <Loader2 size={9} className="locate-spin" /> : <LocateFixed size={9} />}
              Use my location
            </button>
          </span>
          <HomeLocationPicker
            country={selectedCountry}
            state={selectedState}
            city={selectedCity}
            onChange={(c, s, ci) => { setSelectedCountry(c); setSelectedState(s); setSelectedCity(ci); }}
            loading={detectingOnLoad}
          />
        </div>
        <button type="submit" className="primary home-search-submit">
          <Search size={15} />
          Search
        </button>
      </form>

      {/* {nearbyCards && nearbyCards.length > 0 ? (
        <div className="home-hero-nearby">
          <span className="home-hero-nearby-label">Live near you</span>
          <div className="home-hero-nearby-cards">
            {nearbyCards.slice(0, 3).map((card) => (
              <Link key={String(card.id)} href={`/card/${String(card.id)}`} className="home-hero-nearby-card">
                <span className="home-hero-nearby-cat">{card.category}</span>
                <span className="home-hero-nearby-name">{card.name}</span>
              </Link>
            ))}
          </div>
          <Link
            href={buildWallPath(selectedCountry, selectedState, selectedCity)}
            className="home-hero-nearby-all"
          >
            See all in {locationDisplayLabel} →
          </Link>
        </div>
      ) : null} */}

      <div className="home-location-hint">
        {locationError ? (
          <span className="home-search-error">{locationError}</span>
        ) : !detectingOnLoad && detectedLoc && !detectedLoc.precise ? (
          <span className="home-location-detected">
            <MapPin size={11} />
            Detected near <strong>{detectedLoc.label}</strong>
            {" · "}
            <button
              type="button"
              className="home-location-precise-btn"
              onClick={handlePreciseLocation}
              disabled={isPreciseLocating}
            >
              <Crosshair size={10} />
              {isPreciseLocating ? "Locating…" : "Use precise location"}
            </button>
          </span>
        ) : !detectingOnLoad && !detectedLoc ? (
          <span className="home-location-detecting">
            <button
              type="button"
              className="home-location-precise-btn"
              onClick={handlePreciseLocation}
              disabled={isPreciseLocating}
            >
              <Crosshair size={10} />
              {isPreciseLocating ? "Locating…" : "Allow location for local results"}
            </button>
          </span>
        ) : null}
      </div>

      {stats ? (
        <div className="home-hero-stats">
          <span>{stats.totalListings.toLocaleString()} ACTIVE LISTINGS</span>
          <span className="home-hero-stats-sep">·</span>
          <span>{stats.totalBusinesses.toLocaleString()} {stats.totalBusinesses === 1 ? "BUSINESS" : "BUSINESSES"}</span>
          <span className="home-hero-stats-sep">·</span>
          <span>{stats.totalCities.toLocaleString()} CITIES</span>
        </div>
      ) : null}
    </div>
  );
}
