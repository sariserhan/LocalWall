import { notFound } from "next/navigation";
import { Country, State } from "country-state-city";
import { parseCountrySlug, parseStateSlug, parseCityFromSlug } from "@/lib/wall-slug-server";
import { fetchInitialCards } from "@/lib/server-cards";
import { buildRssFeed, rssFeedResponse } from "@/lib/rss";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ country: string; state: string; city: string }> },
) {
  const { country: cSlug, state: sSlug, city: citySlug } = await params;
  const country = parseCountrySlug(cSlug);
  if (!country) notFound();
  const state = parseStateSlug(country, sSlug);
  if (!state) notFound();
  const city = parseCityFromSlug(country, state, citySlug);
  if (!city) notFound();

  const countryName = Country.getAllCountries().find((c) => c.isoCode === country)?.name ?? country;
  const stateName = State.getStatesOfCountry(country).find((s) => s.isoCode === state)?.name ?? state;
  const wallPath = `/${cSlug}/${sSlug}/${citySlug}`;

  const cards = await fetchInitialCards({ country, state, city });

  const xml = buildRssFeed({
    title: `${city}, ${stateName} LocalWall — Latest Posts`,
    description: `Recent local ads, services, events and jobs posted on the ${city}, ${stateName} community wall in ${countryName}.`,
    wallPath,
    cards,
  });

  return rssFeedResponse(xml);
}
