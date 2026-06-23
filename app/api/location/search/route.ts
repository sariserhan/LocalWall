import { NextRequest, NextResponse } from "next/server";
import { State, City } from "country-state-city";

function normalizeKey(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]/g, "");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q) return NextResponse.json(null);

  const parts = q.split(",").map((p) => p.trim());
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
      if (cityMatch) {
        return NextResponse.json({ country: "US", state: stateMatch.isoCode, city: cityMatch.name });
      }
    }
  }

  for (const state of usStates) {
    const cities = City.getCitiesOfState("US", state.isoCode);
    const match = cities.find((c) => normalizeKey(c.name) === normalizeKey(cityPart));
    if (match) {
      return NextResponse.json({ country: "US", state: state.isoCode, city: match.name });
    }
  }

  return NextResponse.json(null);
}
