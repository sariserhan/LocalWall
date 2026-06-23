"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { City, State } from "country-state-city";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { buildWallPath, toCategorySlug } from "@/lib/wall-slug";
import { categories } from "@/features/wall/types";

type DetectedLoc = {
  country: string;
  state: string;
  city: string;
  label: string;
  precise?: boolean;
};

function normalizeKey(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function resolveIpLocation(): Promise<{ country: string; state: string; city: string } | null> {
  try {
    const cached = window.sessionStorage.getItem("wall-ip-location-v1");
    const entry = cached
      ? (JSON.parse(cached) as { expiresAt: number; data: Record<string, unknown> })
      : null;
    const data =
      entry && entry.expiresAt > Date.now()
        ? entry.data
        : ((await fetch("https://ipapi.co/json/").then((r) => r.json())) as Record<string, unknown>);
    if (!entry || entry.expiresAt <= Date.now()) {
      window.sessionStorage.setItem(
        "wall-ip-location-v1",
        JSON.stringify({ expiresAt: Date.now() + 30 * 60 * 1000, data }),
      );
    }
    const country = String(data.country_code ?? "US").toUpperCase();
    const regionCode = String(data.region_code ?? "").trim();
    const cityNameRaw = String(data.city ?? "").trim();
    const states = State.getStatesOfCountry(country);
    let stateCode = "";
    if (regionCode) {
      const found = states.find((s) => s.isoCode.toUpperCase() === regionCode.toUpperCase());
      stateCode = found?.isoCode ?? "";
    }
    const cities = stateCode ? City.getCitiesOfState(country, stateCode) : [];
    let cityName = "";
    if (cityNameRaw && cities.length > 0) {
      const norm = normalizeKey(cityNameRaw);
      const found =
        cities.find((c) => normalizeKey(c.name) === norm) ??
        cities.find((c) => normalizeKey(c.name).includes(norm) || norm.includes(normalizeKey(c.name)));
      cityName = found?.name ?? cities[0]?.name ?? "";
    }
    return { country, state: stateCode, city: cityName };
  } catch {
    return null;
  }
}

function makeLabel(city: string, stateCode: string): string {
  return [city, stateCode].filter(Boolean).join(", ");
}

function resolveLocationQuery(query: string): { country: string; state: string; city: string } | null {
  const parts = query.split(",").map((p) => p.trim());
  const cityPart = parts[0];
  const statePart = parts[1] ?? "";
  const usStates = State.getStatesOfCountry("US");

  if (statePart) {
    const stateMatch =
      usStates.find((s) => s.isoCode.toLowerCase() === statePart.toLowerCase()) ??
      usStates.find((s) => normalizeKey(s.name) === normalizeKey(statePart));
    if (stateMatch) {
      const cities = City.getCitiesOfState("US", stateMatch.isoCode);
      const cityMatch =
        cities.find((c) => normalizeKey(c.name) === normalizeKey(cityPart)) ??
        cities.find((c) => normalizeKey(c.name).includes(normalizeKey(cityPart)));
      if (cityMatch) return { country: "US", state: stateMatch.isoCode, city: cityMatch.name };
    }
  }

  for (const state of usStates) {
    const cities = City.getCitiesOfState("US", state.isoCode);
    const match = cities.find((c) => normalizeKey(c.name) === normalizeKey(cityPart));
    if (match) return { country: "US", state: state.isoCode, city: match.name };
  }
  return null;
}

export function HomeSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");
  const [locationInput, setLocationInput] = useState("");
  const [detectedLoc, setDetectedLoc] = useState<DetectedLoc | null>(null);
  const [detectingOnLoad, setDetectingOnLoad] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [isPreciseLocating, setIsPreciseLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    resolveIpLocation()
      .then((loc) => {
        if (loc) {
          const label = makeLabel(loc.city, loc.state);
          setDetectedLoc({ ...loc, label });
          setLocationInput(label);
        }
      })
      .finally(() => setDetectingOnLoad(false));
  }, []);

  const nearbyCards = useQuery(
    api.cards.listPublished,
    detectedLoc && !detectingOnLoad
      ? { country: detectedLoc.country, state: detectedLoc.state, city: detectedLoc.city }
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
        setLocationInput(label);
      }
    }
    setIsLocating(false);
    if (!loc) {
      setLocationError("Could not detect your location. Please type it in the search bar.");
      return;
    }
    router.push(
      buildWallPath(loc.country, loc.state, loc.city, category !== "All" ? category : undefined),
    );
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
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
          );
          const data = (await res.json()) as { address?: Record<string, string> };
          const address = data.address ?? {};
          const countryCode = String(address.country_code ?? "US").toUpperCase();
          const states = State.getStatesOfCountry(countryCode);
          const stateName = String(address.state ?? address.region ?? "");
          const matchedState =
            states.find((s) => normalizeKey(s.name) === normalizeKey(stateName)) ??
            states.find(
              (s) =>
                stateName.toLowerCase().includes(s.name.toLowerCase()) ||
                s.name.toLowerCase().includes(stateName.toLowerCase()),
            );
          const stateCode = matchedState?.isoCode ?? "";
          const cityRaw = String(
            address.city ?? address.town ?? address.village ?? address.county ?? "",
          );
          const cities = City.getCitiesOfState(countryCode, stateCode);
          let finalCity = "";
          if (cityRaw) {
            const exact = cities.find((c) => normalizeKey(c.name) === normalizeKey(cityRaw));
            if (exact) {
              finalCity = exact.name;
            } else {
              let best = cities[0];
              let minDist = Infinity;
              for (const city of cities) {
                if (city.latitude != null && city.longitude != null) {
                  const d = Math.hypot(Number(city.latitude) - lat, Number(city.longitude) - lon);
                  if (d < minDist) {
                    minDist = d;
                    best = city;
                  }
                }
              }
              finalCity = best?.name ?? "";
            }
          }
          const label = makeLabel(finalCity, stateCode);
          setDetectedLoc({ country: countryCode, state: stateCode, city: finalCity, label, precise: true });
          setLocationInput(label);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const kw = keyword.trim();
    const locQuery = locationInput.trim();

    let country = "US", state = "", city = "";
    if (locQuery) {
      const isDetected = detectedLoc && makeLabel(detectedLoc.city, detectedLoc.state) === locQuery;
      if (isDetected && detectedLoc) {
        country = detectedLoc.country;
        state = detectedLoc.state;
        city = detectedLoc.city;
      } else {
        const resolved = resolveLocationQuery(locQuery);
        if (resolved) {
          country = resolved.country;
          state = resolved.state;
          city = resolved.city;
        }
      }
    }

    const path = buildWallPath(country, state, city, category !== "All" ? category : undefined);
    const qs = kw ? `?keyword=${encodeURIComponent(kw)}` : "";
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
            const path = detectedLoc
              ? buildWallPath(detectedLoc.country, detectedLoc.state, detectedLoc.city)
              : "/us";
            router.push(path);
          }}
        >
          Post an ad
        </button>
      </div>

      <form className="home-search-form" onSubmit={handleSearch}>
        <div className="home-search-field">
          <span className="home-search-label">Keyword</span>
          <input
            type="text"
            className="home-search-input"
            placeholder="e.g. Plumber"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            aria-label="Keyword"
          />
        </div>
        <div className="home-search-field">
          <span className="home-search-label">Category</span>
          <select
            className="home-search-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="home-search-field home-search-field-location">
          <span className="home-search-label">
            Location
            {detectingOnLoad ? <Loader2 size={9} className="locate-spin" style={{ marginLeft: 4 }} /> : null}
          </span>
          <input
            type="text"
            className="home-search-input"
            placeholder={detectingOnLoad ? "Detecting…" : "City or area"}
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            aria-label="Location"
          />
        </div>
        <button type="submit" className="primary home-search-submit">
          <Search size={15} />
          Search
        </button>
      </form>

      {nearbyCards && nearbyCards.length > 0 && detectedLoc ? (
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
            href={buildWallPath(detectedLoc.country, detectedLoc.state, detectedLoc.city)}
            className="home-hero-nearby-all"
          >
            See all in {detectedLoc.city || detectedLoc.state} →
          </Link>
        </div>
      ) : null}

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
    </div>
  );
}
