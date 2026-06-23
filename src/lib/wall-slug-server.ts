import { Country, State, City } from "country-state-city";
import { toCitySlug } from "./wall-slug";
export { parseCategorySlug } from "./wall-slug";

export function parseCountrySlug(slug: string): string | null {
  const code = slug.toUpperCase();
  return Country.getAllCountries().some((c) => c.isoCode === code) ? code : null;
}

export function parseStateSlug(country: string, slug: string): string | null {
  const code = slug.toUpperCase();
  return State.getStatesOfCountry(country).some((s) => s.isoCode === code) ? code : null;
}

export function parseCityFromSlug(country: string, state: string, slug: string): string | null {
  const cities = City.getCitiesOfState(country, state);
  return cities.find((c) => toCitySlug(c.name) === slug)?.name ?? null;
}
