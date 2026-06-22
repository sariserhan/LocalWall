import { redirect } from "next/navigation";
import { parseLocationSlug } from "@/lib/wall-slug";

interface Props {
  params: Promise<{ location: string }>;
}

export default async function WallLocationPage({ params }: Props) {
  const { location } = await params;
  const { country, state, city } = parseLocationSlug(location);
  const qs = new URLSearchParams();
  if (country) qs.set("country", country);
  if (state) qs.set("state", state);
  if (city) qs.set("city", city);
  redirect(`/?${qs.toString()}`);
}
