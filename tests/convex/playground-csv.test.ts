import { describe, expect, test } from "vitest";
import {
  buildPlaygroundCsvTemplate,
  parseCsv,
  resolveLocationFields,
  type LocationCatalog,
} from "../../src/features/wall/admin-playground-csv";

const catalog: LocationCatalog = {
  countries: [
    { code: "US", name: "United States" },
    { code: "TR", name: "Turkey" },
  ],
  statesByCountry: new Map([
    ["US", [
      { code: "VA", name: "Virginia" },
      { code: "TX", name: "Texas" },
    ]],
    ["TR", [
      { code: "34", name: "Istanbul" },
    ]],
  ]),
  citiesByCountryState: new Map([
    ["US|VA", ["Arlington"]],
    ["US|TX", ["Austin", "Dallas"]],
    ["TR|34", ["Istanbul"]],
  ]),
};

describe("admin playground csv template", () => {
  test("builds a readable csv template", () => {
    const csv = buildPlaygroundCsvTemplate();
    const { headers, records } = parseCsv(csv);

    expect(headers).toContain("name");
    expect(headers).toContain("country");
    expect(headers).toContain("rating");
    expect(headers).toContain("googleMapsUrl");
    expect(headers).toContain("image");
    expect(records).toHaveLength(2);
    expect(records[0].data.name).toBe("Call Cleaning Collection");
  });

  test("normalizes USA and state codes", () => {
    const resolved = resolveLocationFields(
      { country: "USA", state: "VA", city: "Arlington" },
      catalog,
    );

    expect(resolved.errors).toHaveLength(0);
    expect(resolved.country).toBe("US");
    expect(resolved.state).toBe("VA");
    expect(resolved.city).toBe("Arlington");
  });
});
