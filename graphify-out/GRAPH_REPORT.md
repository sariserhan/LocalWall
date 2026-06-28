# Graph Report - local-wall  (2026-06-28)

## Corpus Check
- 215 files · ~435,860 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 50 nodes · 56 edges · 5 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8c70cafc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Rate Limiting & API Utilities|Rate Limiting & API Utilities]]
- [[_COMMUNITY_Billing, Admin & Test Infrastructure|Billing, Admin & Test Infrastructure]]
- [[_COMMUNITY_Geo-Routed Pages & RSS Feeds|Geo-Routed Pages & RSS Feeds]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]

## God Nodes (most connected - your core abstractions)
1. `openImagesDB()` - 4 edges
2. `WallCard()` - 3 edges
3. `ImageSwapViewer()` - 3 edges
4. `hashString()` - 2 edges
5. `saveImagesToIDB()` - 2 edges
6. `loadImagesFromIDB()` - 2 edges
7. `clearImagesFromIDB()` - 2 edges
8. `websiteHref()` - 2 edges
9. `DetailPanel()` - 2 edges
10. `Composer` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (5 total, 0 thin omitted)

### Community 0 - "Rate Limiting & API Utilities"
Cohesion: 0.10
Nodes (13): BundleCity, ComposerForm, ComposerProps, countries, defaultStates, DetailField, detailFieldLabels, featuredTierOptions (+5 more)

### Community 1 - "Billing, Admin & Test Infrastructure"
Cohesion: 0.24
Nodes (7): CardEvent, DetailPanel(), REPORT_REASONS, ReportReason, websiteHref(), ImageSwapViewer(), ImageSwapViewerProps

### Community 2 - "Geo-Routed Pages & RSS Feeds"
Cohesion: 0.50
Nodes (4): clearImagesFromIDB(), loadImagesFromIDB(), openImagesDB(), saveImagesToIDB()

### Community 3 - "Community 3"
Cohesion: 0.20
Nodes (6): Composer, defaultSeedLocation, DetailPanel, OwnerDashboard, PlacementMode, WallAppProps

### Community 4 - "Community 4"
Cohesion: 0.50
Nodes (4): CardStyle, hashString(), WallCard(), WallCardProps

## Knowledge Gaps
- **25 isolated node(s):** `Composer`, `DetailPanel`, `PlacementMode`, `OwnerDashboard`, `WallAppProps` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ImageSwapViewer()` connect `Billing, Admin & Test Infrastructure` to `Rate Limiting & API Utilities`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `WallCard()` connect `Community 4` to `Community 3`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `openImagesDB()` connect `Geo-Routed Pages & RSS Feeds` to `Rate Limiting & API Utilities`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **What connects `Composer`, `DetailPanel`, `PlacementMode` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Rate Limiting & API Utilities` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._