import { NextRequest, NextResponse } from "next/server";
import { State, City } from "country-state-city";

function normalizeKey(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { countryCode, regionCode, cityNameRaw } = (await req.json()) as {
      countryCode: string;
      regionCode: string;
      cityNameRaw: string;
    };

    const country = countryCode.toUpperCase();
    const states = State.getStatesOfCountry(country);
    let stateCode = "";
    if (regionCode) {
      const found = states.find((s) => s.isoCode.toUpperCase() === regionCode.toUpperCase());
      stateCode = found?.isoCode ?? "";
    }

    const cities = stateCode ? City.getCitiesOfState(country, stateCode) : [];
    let city = "";
    if (cityNameRaw && cities.length > 0) {
      const norm = normalizeKey(cityNameRaw);
      const found =
        cities.find((c) => normalizeKey(c.name) === norm) ??
        cities.find((c) => normalizeKey(c.name).includes(norm) || norm.includes(normalizeKey(c.name)));
      city = found?.name ?? cities[0]?.name ?? "";
    }

    return NextResponse.json({ country, state: stateCode, city });
  } catch {
    return NextResponse.json({ country: "US", state: "", city: "" });
  }
}
