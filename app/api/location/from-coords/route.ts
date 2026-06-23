import { NextRequest, NextResponse } from "next/server";
import { State, City } from "country-state-city";

function normalizeKey(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]/g, "");
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");
  if (!lat || !lon) return NextResponse.json(null);

  try {
    const geo = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      { headers: { "User-Agent": "LocalWall/1.0 (localwall.app)" } },
    );
    const data = (await geo.json()) as { address?: Record<string, string> };
    const address = data.address ?? {};

    const countryCode = String(address.country_code ?? "US").toUpperCase();
    const stateName = String(address.state ?? address.region ?? "");
    const states = State.getStatesOfCountry(countryCode);
    const matchedState =
      states.find((s) => normalizeKey(s.name) === normalizeKey(stateName)) ??
      states.find(
        (s) =>
          stateName.toLowerCase().includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(stateName.toLowerCase()),
      );
    const stateCode = matchedState?.isoCode ?? "";

    const cityRaw = String(address.city ?? address.town ?? address.village ?? address.county ?? "");
    const cities = City.getCitiesOfState(countryCode, stateCode);
    let finalCity = "";

    if (cityRaw) {
      const exact = cities.find((c) => normalizeKey(c.name) === normalizeKey(cityRaw));
      if (exact) {
        finalCity = exact.name;
      } else {
        const latN = parseFloat(lat);
        const lonN = parseFloat(lon);
        let best = cities[0];
        let minDist = Infinity;
        for (const city of cities) {
          if (city.latitude != null && city.longitude != null) {
            const d = Math.hypot(Number(city.latitude) - latN, Number(city.longitude) - lonN);
            if (d < minDist) { minDist = d; best = city; }
          }
        }
        finalCity = best?.name ?? "";
      }
    }

    return NextResponse.json({ country: countryCode, state: stateCode, city: finalCity });
  } catch {
    return NextResponse.json(null);
  }
}
