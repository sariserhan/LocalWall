import { redirect } from "next/navigation";
import { parseLocationSlug, parseCategorySlug } from "@/lib/wall-slug";

interface Props {
  params: Promise<{ location: string; category: string }>;
}

export default async function WallLocationCategoryPage({ params }: Props) {
  const { location, category } = await params;
  const { country, state, city } = parseLocationSlug(location);
  const { category: cat, keyword } = parseCategorySlug(category);
  const qs = new URLSearchParams();
  if (country) qs.set("country", country);
  if (state) qs.set("state", state);
  if (city) qs.set("city", city);
  if (cat) qs.set("category", cat);
  if (keyword) qs.set("keyword", keyword);
  redirect(`/?${qs.toString()}`);
}
