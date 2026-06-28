"use client";

import { AlertTriangle, BarChart2, Bookmark, Bug, Check, Eye, EyeOff, ExternalLink, Flag, FlaskConical, Layers, Mail, MapPin, Phone, Search, ShieldCheck, Share2, Trash2, UserRound, X, XCircle } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { AdminPlayground } from "./admin-playground";

export interface AdminDashboardData {
  stats: { cards: number; published: number; users: number; reports: number; bugs: number; messages: number; searches: number; logins?: number; wallVisits?: number; pendingVerifications?: number };
  cards: Array<{
    id: Id<"cards">;
    name: string;
    line: string;
    area: string;
    city: string;
    state: string;
    country: string;
    status: "published" | "hidden" | "expired";
    ownerName?: string;
    ownerEmail?: string;
    clicks: number;
    expiresAt: number;
    createdAt: number;
    conversions?: { website: number; phone: number; email: number; social: number; saves: number; shares: number; total: number };
  }>;
  users: Array<{
    id: Id<"users">;
    displayName?: string;
    username?: string;
    businessName?: string;
    email?: string;
    blockedAt?: number;
    blockedReason?: string;
    verified?: boolean;
    verifiedAt?: number;
    createdAt: number;
    cardCount: number;
  }>;
  reports: Array<{ id: Id<"reports">; cardId: Id<"cards">; cardName: string; reason: string; details?: string; createdAt: number }>;
  bugReports: Array<{ id: Id<"bugReports">; page: string; reason: string; details?: string; reporterName?: string; reporterEmail?: string; createdAt: number }>;
  contactMessages: Array<{ id: Id<"contactMessages">; page: string; topic: string; message: string; reporterName?: string; reporterUsername?: string; reporterEmail?: string; reporterBusinessName?: string; reporterPhone?: string; createdAt: number }>;
  searchInsights?: { topKeywords: Array<{ keyword: string; count: number }>; topCategories: Array<{ category: string; count: number }>; topLocations: Array<{ location: string; count: number }>; total: number };
  wallInsights?: {
    totalVisits: number;
    topWalls: Array<{ path: string; visits: number; uniqueUsers: number; lastVisitedAt: number }>;
    recentVisits: Array<{ wallId: Id<"walls">; path: string; visitedAt: number; userName: string }>;
  };
  userInsights?: {
    totalLogins: number;
    dailyLogins: Array<{ date: string; count: number }>;
    dailySignups: Array<{ date: string; count: number }>;
    topLoginUsers: Array<{ id: Id<"users"> | string; label: string; count: number }>;
  };
  verificationRequests?: Array<{
    id: Id<"verificationRequests">;
    userId: Id<"users">;
    status: "pending" | "approved" | "rejected";
    plan: "monthly" | "annual";
    paidAmount: number;
    userName?: string;
    userEmail?: string;
    createdAt: number;
    reviewedAt?: number;
    rejectedReason?: string;
  }>;
}

interface AdminPanelProps {
  data?: AdminDashboardData;
  onClose: () => void;
  onSetCardStatus: (cardId: Id<"cards">, status: "published" | "hidden") => Promise<void>;
  onDeleteCard: (cardId: Id<"cards">) => Promise<void>;
  onPurgeOrphanCardData: () => Promise<void>;
  onDeleteCardsByOwner: (userId: Id<"users">) => Promise<void>;
  onBlockUser: (userId: Id<"users">) => Promise<void>;
  onUnblockUser: (userId: Id<"users">, restoreCards: boolean) => Promise<void>;
  onVerifyUser: (userId: Id<"users">, verified: boolean) => Promise<void>;
  onResolveReport: (reportId: Id<"reports">) => Promise<void>;
  onResolveBugReport: (bugReportId: Id<"bugReports">) => Promise<void>;
  onResolveContactMessage: (contactMessageId: Id<"contactMessages">) => Promise<void>;
  onApproveVerification: (requestId: Id<"verificationRequests">) => Promise<void>;
  onRejectVerification: (requestId: Id<"verificationRequests">) => Promise<void>;
}

function dateLabel(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(timestamp);
}

export function AdminPanel({ data, onClose, onSetCardStatus, onDeleteCard, onPurgeOrphanCardData, onDeleteCardsByOwner, onBlockUser, onUnblockUser, onVerifyUser, onResolveReport, onResolveBugReport, onResolveContactMessage, onApproveVerification, onRejectVerification }: AdminPanelProps) {
  const [tab, setTab] = useState<"cards" | "users" | "reports" | "bugs" | "contact" | "analytics" | "verification" | "playground" | "maintenance">("cards");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminDashboardData["cards"][number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const cards = useMemo(() => (data?.cards ?? []).filter((card) => !deferredQuery || [card.name, card.line, card.area, card.city, card.ownerName, card.ownerEmail].some((value) => value?.toLowerCase().includes(deferredQuery))), [data?.cards, deferredQuery]);
  const users = useMemo(() => (data?.users ?? []).filter((user) => !deferredQuery || [user.displayName, user.username, user.businessName, user.email].some((value) => value?.toLowerCase().includes(deferredQuery))), [data?.users, deferredQuery]);
  const reports = useMemo(() => (data?.reports ?? []).filter((report) => !deferredQuery || [report.cardName, report.reason, report.details].some((value) => value?.toLowerCase().includes(deferredQuery))), [data?.reports, deferredQuery]);
  const bugReports = useMemo(() => (data?.bugReports ?? []).filter((bugReport) => !deferredQuery || [bugReport.page, bugReport.reason, bugReport.details, bugReport.reporterName, bugReport.reporterEmail].some((value) => value?.toLowerCase().includes(deferredQuery))), [data?.bugReports, deferredQuery]);
  const contactMessages = useMemo(() => (data?.contactMessages ?? []).filter((contactMessage) => !deferredQuery || [contactMessage.page, contactMessage.topic, contactMessage.message, contactMessage.reporterName, contactMessage.reporterUsername, contactMessage.reporterBusinessName, contactMessage.reporterEmail, contactMessage.reporterPhone].some((value) => value?.toLowerCase().includes(deferredQuery))), [data?.contactMessages, deferredQuery]);
  const cardsById = useMemo(() => new Map((data?.cards ?? []).map((card) => [String(card.id), card])), [data?.cards]);
  const maxLoginCount = data?.userInsights ? Math.max(1, ...data.userInsights.dailyLogins.map((day) => day.count)) : 1;
  const matchesAnalyticsQuery = (value: string) => !deferredQuery || value.toLowerCase().includes(deferredQuery);
  const analyticsSearchInput = tab === "analytics" ? (
    <label className="admin-panel-search">
      <Search />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search analytics" aria-label="Search analytics" />
    </label>
  ) : null;
  const searchPlaceholder = tab === "users"
    ? "Search users"
    : tab === "cards"
    ? "Search cards"
    : tab === "reports"
    ? "Search reports"
    : tab === "bugs"
    ? "Search bug reports"
    : tab === "contact"
    ? "Search messages"
    : tab === "verification"
    ? "Search verifications"
    : `Search ${tab}`;
  const panelSearch = tab !== "analytics" && tab !== "maintenance" && tab !== "playground" ? (
    <label className="admin-panel-search" data-tab={tab}>
      <Search />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
    </label>
  ) : null;
  const analyticsKeywords = data?.searchInsights?.topKeywords.filter(({ keyword }) => matchesAnalyticsQuery(keyword)) ?? [];
  const analyticsCategories = data?.searchInsights?.topCategories.filter(({ category }) => matchesAnalyticsQuery(category)) ?? [];
  const analyticsLocations = data?.searchInsights?.topLocations.filter(({ location }) => matchesAnalyticsQuery(location)) ?? [];
  const analyticsWalls = data?.wallInsights?.topWalls.filter(({ path }) => matchesAnalyticsQuery(path)) ?? [];
  const analyticsRecentVisits = data?.wallInsights?.recentVisits.filter(({ path, userName }) => matchesAnalyticsQuery(path) || matchesAnalyticsQuery(userName)) ?? [];
  const analyticsCards = data?.cards.filter((card) => matchesAnalyticsQuery(card.name) || matchesAnalyticsQuery(card.city) || matchesAnalyticsQuery(card.state) || matchesAnalyticsQuery(card.country)) ?? [];
  const sendMessage = (email: string | undefined, context: string) => {
    if (!email) {
      setError("This owner has no public email address.");
      return;
    }
    const subject = encodeURIComponent(`WALL moderation notice: ${context}`);
    const body = encodeURIComponent("Hello,\n\nThis is a moderation message from WALL admin regarding your card/account.\n\nPlease reply to this email for support.\n");
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_self");
  };

  const setStatus = async (card: AdminDashboardData["cards"][number]) => {
    const status = card.status === "published" ? "hidden" : "published";
    setBusyId(String(card.id));
    setError(null);
    try {
      await onSetCardStatus(card.id, status);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The card could not be updated.");
    } finally {
      setBusyId(null);
    }
  };

  const removeCard = async () => {
    if (!deleteTarget) return;
    setBusyId(String(deleteTarget.id));
    setError(null);
    try {
      await onDeleteCard(deleteTarget.id);
      setDeleteTarget(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The card could not be deleted.");
    } finally {
      setBusyId(null);
    }
  };

  const purgeOrphanCardData = async () => {
    const confirmed = window.confirm("Delete orphaned reviews, saved cards, likes, stats, and daily stats for cards that no longer exist?");
    if (!confirmed) return;
    setBusyId("purge-orphans");
    setError(null);
    try {
      await onPurgeOrphanCardData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The orphaned data could not be deleted.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="dashboard-backdrop admin-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="owner-dashboard admin-panel" aria-label="Admin panel">
        <header className="dashboard-header">
          <div><span>LOCALWALL ADMINISTRATION</span><h2>Admin panel</h2></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close admin panel"><X /></button>
        </header>

        <div className="dashboard-stats">
          <div><ShieldCheck /><span>Published cards</span><strong>{data?.stats.published ?? "—"}</strong></div>
          <div><Eye /><span>Recent cards</span><strong>{data?.stats.cards ?? "—"}</strong></div>
          <div><UserRound /><span>Recent users</span><strong>{data?.stats.users ?? "—"}</strong></div>
          <div><Check /><span>Logins (30d)</span><strong>{data?.stats.logins ?? "—"}</strong></div>
          <div><Flag /><span>Open reports</span><strong>{data?.stats.reports ?? "—"}</strong></div>
          <div><Bug /><span>Open bugs</span><strong>{data?.stats.bugs ?? "—"}</strong></div>
          <div><Mail /><span>Contact messages</span><strong>{data?.stats.messages ?? "—"}</strong></div>
          <div><Search /><span>Searches (30d)</span><strong>{data?.stats.searches ?? "—"}</strong></div>
          <div><MapPin /><span>Wall visits (30d)</span><strong>{data?.stats.wallVisits ?? "—"}</strong></div>
          <div className="admin-stats-link">
            <ExternalLink />
            <span>Shortcut</span>
            <button type="button" className="admin-stats-button" onClick={() => window.open("/admin/wall", "_blank", "noopener,noreferrer")}>
              Go to admin/wall page
            </button>
          </div>
        </div>

        <div className="admin-controls">
          <div className="admin-tabs" role="tablist" aria-label="Admin sections">
            <button role="tab" aria-selected={tab === "cards"} className={tab === "cards" ? "selected" : ""} onClick={() => setTab("cards")}><Layers size={13} /> Cards</button>
            <button role="tab" aria-selected={tab === "users"} className={tab === "users" ? "selected" : ""} onClick={() => setTab("users")}><UserRound size={13} /> Users</button>
            <button role="tab" aria-selected={tab === "reports"} className={tab === "reports" ? "selected" : ""} onClick={() => setTab("reports")}><Flag size={13} /> Reports</button>
            <button role="tab" aria-selected={tab === "bugs"} className={tab === "bugs" ? "selected" : ""} onClick={() => setTab("bugs")}><Bug size={13} /> Bugs</button>
            <button role="tab" aria-selected={tab === "contact"} className={tab === "contact" ? "selected" : ""} onClick={() => setTab("contact")}><Mail size={13} /> Contact{(data?.stats.messages ?? 0) > 0 ? <span className="admin-tab-badge">{data?.stats.messages}</span> : null}</button>
            <button role="tab" aria-selected={tab === "analytics"} className={tab === "analytics" ? "selected" : ""} onClick={() => setTab("analytics")}><BarChart2 size={13} /> Analytics</button>
            <button role="tab" aria-selected={tab === "verification"} className={tab === "verification" ? "selected" : ""} onClick={() => setTab("verification")}>
              <ShieldCheck size={13} /> Verifications{(data?.stats.pendingVerifications ?? 0) > 0 ? <span className="admin-tab-badge">{data?.stats.pendingVerifications}</span> : null}
            </button>
            <button role="tab" aria-selected={tab === "maintenance"} className={tab === "maintenance" ? "selected" : ""} onClick={() => setTab("maintenance")}><Trash2 size={13} /> Maintenance</button>
            <button role="tab" aria-selected={tab === "playground"} className={`${tab === "playground" ? "selected" : ""} admin-tab-playground`} onClick={() => setTab("playground")}>
              <FlaskConical size={13} /> Playground
            </button>
          </div>
        </div>

        {error ? <div className="dashboard-error" role="alert">{error}</div> : null}
        {!data ? <div className="dashboard-empty">Loading administration data…</div> : null}

        {data && tab === "cards" ? (
          <div className="admin-list" role="tabpanel">
            {panelSearch}
            {cards.map((card) => {
              const busy = busyId === String(card.id);
              return (
                <article className="admin-row" key={String(card.id)}>
                  <div className="admin-row-main">
                    <div><span className={`status-dot status-${card.status}`} />{card.status}<span>{dateLabel(card.createdAt)}</span></div>
                    <h3>{card.name}</h3>
                    <p>{card.line}</p>
                    <small>{card.ownerName || card.ownerEmail || "Unknown owner"} · {card.city}, {card.state || card.country} · {card.clicks} opens</small>
                    {card.conversions && card.conversions.total > 0 ? (
                      <div className="admin-conversions">
                        {card.conversions.website > 0 ? <span title="Website clicks"><ExternalLink size={10} />{card.conversions.website}</span> : null}
                        {card.conversions.phone > 0 ? <span title="Phone taps"><Phone size={10} />{card.conversions.phone}</span> : null}
                        {card.conversions.email > 0 ? <span title="Email clicks"><Mail size={10} />{card.conversions.email}</span> : null}
                        {card.conversions.social > 0 ? <span title="Social clicks"><MapPin size={10} />{card.conversions.social}</span> : null}
                        {card.conversions.saves > 0 ? <span title="Saves"><Bookmark size={10} />{card.conversions.saves}</span> : null}
                        {card.conversions.shares > 0 ? <span title="Shares"><Share2 size={10} />{card.conversions.shares}</span> : null}
                        <span className="admin-conv-total">{card.conversions.total} conversions</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="admin-row-actions admin-row-actions-wide">
                    <button className="secondary" disabled={!card.ownerEmail} onClick={() => sendMessage(card.ownerEmail, card.name)}><Mail /> Send message</button>
                    <button className="secondary" disabled={busy || card.status === "expired"} onClick={() => setStatus(card)}>{card.status === "published" ? <><EyeOff /> Hide</> : <><Eye /> Restore</>}</button>
                    <button className="secondary danger-action" disabled={busy} onClick={() => setDeleteTarget(card)}><Trash2 /> Delete</button>
                  </div>
                </article>
              );
            })}
            {!cards.length ? <div className="dashboard-empty">No cards match this search.</div> : null}
          </div>
        ) : null}

        {data && tab === "users" ? (
          <div className="admin-users-panel" role="tabpanel">
            {panelSearch}
            <div className="admin-list">
            {users.map((user) => (
              <article className="admin-row admin-user-row" key={String(user.id)}>
                <div className="admin-avatar">{(user.displayName || user.businessName || user.username || user.email || "U").slice(0, 1).toUpperCase()}</div>
                <div className="admin-row-main">
                  <h3>{user.displayName || user.businessName || user.username || "Unnamed user"}{user.verified ? <span className="admin-verified-badge">✓ Verified</span> : null}</h3>
                  <p>{user.businessName || user.username ? [user.businessName, user.username ? `@${user.username}` : null].filter(Boolean).join(" · ") : user.email || "No public email"}</p>
                  <small>Joined {dateLabel(user.createdAt)} · {user.cardCount} recent cards{user.verifiedAt ? ` · Verified ${dateLabel(user.verifiedAt)}` : ""}</small>
                </div>
                <div className="admin-row-actions admin-row-actions-wide">
                  <button className="secondary" disabled={!user.email} onClick={() => sendMessage(user.email, user.displayName || "WALL account")}><Mail /> Send message</button>
                  <button className={`secondary${user.verified ? "" : " verify-action"}`} disabled={busyId === String(user.id)} onClick={async () => {
                    setBusyId(String(user.id));
                    setError(null);
                    try {
                      await onVerifyUser(user.id, !user.verified);
                    } catch (cause) {
                      setError(cause instanceof Error ? cause.message : "The verification status could not be updated.");
                    } finally {
                      setBusyId(null);
                    }
                  }}>{user.verified ? <><X size={13} /> Unverify</> : <><Check size={13} /> Verify</>}</button>
                  <button className="secondary danger-action" disabled={busyId === String(user.id)} onClick={async () => {
                    const confirmed = window.confirm(`Delete all cards for ${user.displayName || user.businessName || user.username || user.email || "this user"}?`);
                    if (!confirmed) return;
                    setBusyId(String(user.id));
                    setError(null);
                    try {
                      await onDeleteCardsByOwner(user.id);
                    } catch (cause) {
                      setError(cause instanceof Error ? cause.message : "The cards could not be deleted.");
                    } finally {
                      setBusyId(null);
                    }
                  }}><Trash2 /> Delete cards</button>
                  <button className="secondary danger-action" disabled={busyId === String(user.id)} onClick={async () => {
                    setBusyId(String(user.id));
                    setError(null);
                    try {
                      if (user.blockedAt) {
                        const restoreCards = window.confirm("Also restore this user's hidden non-expired cards?");
                        await onUnblockUser(user.id, restoreCards);
                      } else {
                        await onBlockUser(user.id);
                      }
                    } catch (cause) {
                      setError(cause instanceof Error ? cause.message : user.blockedAt ? "The user could not be unblocked." : "The user could not be blocked.");
                    } finally {
                      setBusyId(null);
                    }
                  }}>{user.blockedAt ? <><Check /> Unblock user</> : <><Flag /> Block user</>}</button>
                </div>
              </article>
            ))}
            {!users.length ? <div className="dashboard-empty">No users match this search.</div> : null}
          </div>
          </div>
        ) : null}

        {data && tab === "analytics" ? (
          <div className="admin-analytics" role="tabpanel">
            {analyticsSearchInput}
            <div className="admin-analytics-intro">
              <div>
                <span>Analytics</span>
                <h3>What people are doing</h3>
                <p>Last 30 days of search, wall, and account activity.</p>
              </div>
              <div className="admin-analytics-summary admin-analytics-summary-tight">
                <div><strong>{data.stats.searches ?? "—"}</strong><span>searches</span></div>
                <div><strong>{data.stats.wallVisits ?? "—"}</strong><span>wall visits</span></div>
                <div><strong>{data.stats.logins ?? "—"}</strong><span>logins</span></div>
              </div>
            </div>
            <div className="admin-analytics-grid">
            <div className="admin-analytics-section admin-analytics-section-highlight">
              <h3>User logins <span className="admin-analytics-period">(last 30 days)</span></h3>
              {data.userInsights ? (
                <>
                  <div className="admin-analytics-summary">
                    <div><strong>{data.userInsights.totalLogins}</strong><span>sessions recorded</span></div>
                    <div><strong>{data.userInsights.dailySignups.reduce((sum, day) => sum + day.count, 0)}</strong><span>new users</span></div>
                  </div>
                  {data.userInsights.dailyLogins.length > 0 ? (
                    <ol className="admin-analytics-list">
                      {data.userInsights.dailyLogins.slice(-7).map(({ date, count }) => (
                        <li key={date}>
                          <span className="admin-analytics-term">{dateLabel(new Date(`${date}T00:00:00Z`).getTime())}</span>
                          <span className="admin-analytics-bar" style={{ width: `${Math.round((count / maxLoginCount) * 100)}%` }} />
                          <span className="admin-analytics-count">{count}</span>
                        </li>
                      ))}
                    </ol>
                  ) : <p className="dashboard-empty">No login events yet.</p>}
                  {data.userInsights.topLoginUsers.length > 0 ? (
                    <div className="admin-analytics-mini">
                      {data.userInsights.topLoginUsers.slice(0, 5).map((user) => (
                        <div key={String(user.id)}>
                          <strong>{user.label}</strong>
                          <span>{user.count} sessions</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : <p className="dashboard-empty">No login analytics yet.</p>}
            </div>
            <div className="admin-analytics-section">
              <h3>Top search keywords <span className="admin-analytics-period">(last 30 days)</span></h3>
              {analyticsKeywords.length > 0 ? (
                <ol className="admin-analytics-list">
                  {analyticsKeywords.map(({ keyword, count }) => (
                    <li key={keyword}>
                      <span className="admin-analytics-term">{keyword}</span>
                      <span className="admin-analytics-bar" style={{ width: `${Math.round((count / (data.searchInsights?.topKeywords[0]?.count ?? 1)) * 100)}%` }} />
                      <span className="admin-analytics-count">{count}</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="dashboard-empty">No keyword searches yet.</p>}
            </div>
            <div className="admin-analytics-section">
              <h3>Top searched categories <span className="admin-analytics-period">(last 30 days)</span></h3>
              {analyticsCategories.length > 0 ? (
                <ol className="admin-analytics-list">
                  {analyticsCategories.map(({ category, count }) => (
                    <li key={category}>
                      <span className="admin-analytics-term">{category}</span>
                      <span className="admin-analytics-bar" style={{ width: `${Math.round((count / (data.searchInsights?.topCategories[0]?.count ?? 1)) * 100)}%` }} />
                      <span className="admin-analytics-count">{count}</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="dashboard-empty">No category searches yet.</p>}
            </div>
            <div className="admin-analytics-section">
              <h3>Top searched locations <span className="admin-analytics-period">(last 30 days)</span></h3>
              {analyticsLocations.length > 0 ? (
                <ol className="admin-analytics-list">
                  {analyticsLocations.map(({ location, count }) => (
                    <li key={location}>
                      <span className="admin-analytics-term">{location}</span>
                      <span className="admin-analytics-bar" style={{ width: `${Math.round((count / (data.searchInsights?.topLocations[0]?.count ?? 1)) * 100)}%` }} />
                      <span className="admin-analytics-count">{count}</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="dashboard-empty">No location searches yet.</p>}
            </div>
            <div className="admin-analytics-section admin-analytics-section-wide">
              <h3>Used walls <span className="admin-analytics-period">(last 30 days)</span></h3>
              {analyticsWalls.length > 0 ? (
                <ol className="admin-analytics-list">
                  {analyticsWalls.map((wall) => (
                    <li key={wall.path}>
                      <span className="admin-analytics-term">{wall.path}</span>
                      <span className="admin-analytics-card-stats">{wall.visits} visits · {wall.uniqueUsers} signed-in users</span>
                      <span className="admin-analytics-count">{dateLabel(wall.lastVisitedAt)}</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="dashboard-empty">No wall visits yet.</p>}
              {analyticsRecentVisits.length ? (
                <div className="admin-analytics-mini">
                  {analyticsRecentVisits.slice(0, 5).map((visit) => (
                    <div key={`${String(visit.wallId)}-${visit.visitedAt}`}>
                      <strong>{visit.path}</strong>
                      <span>{visit.userName} · {dateLabel(visit.visitedAt)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="admin-analytics-section admin-analytics-section-wide">
              <h3>Top converting cards</h3>
              {analyticsCards.filter((c) => (c.conversions?.total ?? 0) > 0).length > 0 ? (
                <ol className="admin-analytics-list">
                  {analyticsCards
                    .filter((c) => (c.conversions?.total ?? 0) > 0)
                    .sort((a, b) => (b.conversions?.total ?? 0) - (a.conversions?.total ?? 0))
                    .slice(0, 10)
                    .map((card) => (
                      <li key={String(card.id)}>
                        <span className="admin-analytics-term">{card.name} <em>{card.city}</em></span>
                        <span className="admin-analytics-card-stats">
                          {card.clicks} opens · {card.conversions?.total} conv.
                          {card.conversions?.phone ? <> · <Phone size={10} />{card.conversions.phone}</> : null}
                          {card.conversions?.website ? <> · <ExternalLink size={10} />{card.conversions.website}</> : null}
                          {card.conversions?.email ? <> · <Mail size={10} />{card.conversions.email}</> : null}
                        </span>
                      </li>
                    ))}
                </ol>
              ) : <p className="dashboard-empty">No conversion data yet.</p>}
            </div>
            </div>
          </div>
        ) : null}

        {data && tab === "reports" ? (
          <div className="admin-list" role="tabpanel">
            {panelSearch}
            {reports.map((report) => {
              const card = cardsById.get(String(report.cardId));
              const busy = busyId === String(report.id);
              return (
                <article className="admin-row" key={String(report.id)}>
                  <div className="admin-row-main"><div><span>{dateLabel(report.createdAt)}</span></div><h3>{report.cardName}</h3><p>{report.details || report.reason}</p><small>Reason: {report.reason}</small></div>
                  <div className="admin-row-actions admin-row-actions-wide">
                    <button className="secondary" disabled={!card?.ownerEmail || busy} onClick={() => sendMessage(card?.ownerEmail, card?.name || report.cardName)}><Mail /> Send message</button>
                    <button className="secondary" disabled={!card || busy || card.status === "expired"} onClick={async () => {
                      if (!card) return;
                      setBusyId(String(report.id));
                      setError(null);
                      try {
                        await onSetCardStatus(card.id, "hidden");
                        await onResolveReport(report.id);
                      } catch (cause) {
                        setError(cause instanceof Error ? cause.message : "The card could not be hidden.");
                      } finally {
                        setBusyId(null);
                      }
                    }}><EyeOff /> Hide</button>
                    <button className="secondary danger-action" disabled={!card || busy} onClick={async () => {
                      if (!card) return;
                      setBusyId(String(report.id));
                      setError(null);
                      try {
                        await onDeleteCard(card.id);
                        await onResolveReport(report.id);
                      } catch (cause) {
                        setError(cause instanceof Error ? cause.message : "The card could not be deleted.");
                      } finally {
                        setBusyId(null);
                      }
                    }}><Trash2 /> Delete</button>
                    <button className="secondary" disabled={busy} onClick={async () => { setBusyId(String(report.id)); try { await onResolveReport(report.id); } finally { setBusyId(null); } }}><Check /> Resolve</button>
                  </div>
                </article>
              );
            })}
            {!reports.length ? <div className="dashboard-empty">No open reports.</div> : null}
          </div>
        ) : null}

        {data && tab === "bugs" ? (
          <div className="admin-list" role="tabpanel">
            {panelSearch}
            {bugReports.map((bugReport) => {
              const busy = busyId === String(bugReport.id);
              return (
                <article className="admin-row" key={String(bugReport.id)}>
                  <div className="admin-row-main">
                    <div><span>{dateLabel(bugReport.createdAt)}</span></div>
                    <h3>{bugReport.reason.replace(/-/g, " ")}</h3>
                    <p>{bugReport.details || bugReport.page}</p>
                    <small>{bugReport.page}{bugReport.reporterName || bugReport.reporterEmail ? ` · ${bugReport.reporterName || bugReport.reporterEmail}` : ""}</small>
                  </div>
                  <div className="admin-row-actions admin-row-actions-wide">
                    <button className="secondary" disabled={!bugReport.reporterEmail || busy} onClick={() => sendMessage(bugReport.reporterEmail, `Bug report: ${bugReport.page}`)}><Mail /> Send message</button>
                    <button className="secondary" disabled={busy} onClick={async () => {
                      setBusyId(String(bugReport.id));
                      setError(null);
                      try {
                        await onResolveBugReport(bugReport.id);
                      } catch (cause) {
                        setError(cause instanceof Error ? cause.message : "The bug report could not be resolved.");
                      } finally {
                        setBusyId(null);
                      }
                    }}><Check /> Resolve</button>
                  </div>
                </article>
              );
            })}
            {!bugReports.length ? <div className="dashboard-empty">No open bug reports.</div> : null}
          </div>
        ) : null}

        {data && tab === "contact" ? (
          <div className="admin-list" role="tabpanel">
            {panelSearch}
            {contactMessages.map((contactMessage) => {
              const busy = busyId === String(contactMessage.id);
              return (
                <article className="admin-row" key={String(contactMessage.id)}>
                  <div className="admin-row-main">
                    <div><span>{dateLabel(contactMessage.createdAt)}</span></div>
                    <h3>{contactMessage.topic}</h3>
                    <p>{contactMessage.message}</p>
                    <small>
                      {contactMessage.page}
                      {contactMessage.reporterName || contactMessage.reporterEmail ? ` · ${contactMessage.reporterName || contactMessage.reporterEmail}` : ""}
                      {contactMessage.reporterUsername ? ` · @${contactMessage.reporterUsername}` : ""}
                      {contactMessage.reporterBusinessName ? ` · ${contactMessage.reporterBusinessName}` : ""}
                      {contactMessage.reporterPhone ? ` · ${contactMessage.reporterPhone}` : ""}
                    </small>
                  </div>
                  <div className="admin-row-actions admin-row-actions-wide">
                    <button className="secondary" disabled={!contactMessage.reporterEmail || busy} onClick={() => sendMessage(contactMessage.reporterEmail, contactMessage.topic)}><Mail /> Reply</button>
                    <button className="secondary" disabled={busy} onClick={async () => {
                      setBusyId(String(contactMessage.id));
                      setError(null);
                      try {
                        await onResolveContactMessage(contactMessage.id);
                      } catch (cause) {
                        setError(cause instanceof Error ? cause.message : "The contact message could not be resolved.");
                      } finally {
                        setBusyId(null);
                      }
                    }}><Check /> Resolve</button>
                  </div>
                </article>
              );
            })}
            {!contactMessages.length ? <div className="dashboard-empty">No open contact messages.</div> : null}
          </div>
        ) : null}

        {data && tab === "maintenance" ? (
          <div className="admin-maintenance-panel" role="tabpanel">
            <div className="admin-maintenance-hero">
              <div className="admin-maintenance-kicker">Maintenance</div>
              <div className="admin-maintenance-copy">
                <h3>Card cleanup</h3>
                <p>Remove leftover rows for cards that no longer exist.</p>
                <small>Cleanup removes reviews, saved cards, likes, stats, and daily stats only.</small>
              </div>
              <button className="secondary danger-action admin-maintenance-button" disabled={busyId === "purge-orphans"} onClick={() => void purgeOrphanCardData()}>
                <Trash2 /> {busyId === "purge-orphans" ? "Purging…" : "Purge data"}
              </button>
            </div>
            <div className="admin-maintenance-card">
              <div className="admin-maintenance-copy">
                <h3>Future tools</h3>
                <p>Space for one-off moderation or cleanup actions.</p>
              </div>
              <div className="admin-maintenance-chip">Keep it short. Keep it scary.</div>
            </div>
          </div>
        ) : null}

        {data && tab === "verification" ? (
          <div className="admin-list" role="tabpanel">
            {panelSearch}
            {(data.verificationRequests ?? []).map((req) => {
              const busy = busyId === String(req.id);
              return (
                <article className="admin-row" key={String(req.id)}>
                  <div className="admin-row-main">
                    <div><span className={`verification-request-status vrs-${req.status}`}>{req.status}</span><span>{dateLabel(req.createdAt)}</span></div>
                    <h3>{req.userName || "Unknown user"}</h3>
                    <p>{req.userEmail || "No email on file"}</p>
                    <small>{req.plan === "monthly" ? "Monthly — $4.99" : "Annual — $19.99"}{req.reviewedAt ? ` · Reviewed ${dateLabel(req.reviewedAt)}` : ""}{req.rejectedReason ? ` · ${req.rejectedReason}` : ""}</small>
                  </div>
                  <div className="admin-row-actions admin-row-actions-wide">
                    {req.status === "pending" ? (
                      <>
                        <button className="secondary verify-action" disabled={busy} onClick={async () => {
                          setBusyId(String(req.id));
                          setError(null);
                          try { await onApproveVerification(req.id); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not approve verification."); } finally { setBusyId(null); }
                        }}><Check size={13} /> Approve</button>
                        <button className="secondary danger-action" disabled={busy} onClick={async () => {
                          setBusyId(String(req.id));
                          setError(null);
                          try { await onRejectVerification(req.id); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reject verification."); } finally { setBusyId(null); }
                        }}><XCircle size={13} /> Reject</button>
                      </>
                    ) : null}
                    {req.userEmail ? <button className="secondary" onClick={() => sendMessage(req.userEmail, "Verification request")}><Mail size={13} /> Email</button> : null}
                  </div>
                </article>
              );
            })}
            {!(data.verificationRequests ?? []).length ? <div className="dashboard-empty">No verification requests yet.</div> : null}
          </div>
        ) : null}

        {tab === "playground" ? (
          <div role="tabpanel">
            <AdminPlayground />
          </div>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className="dashboard-confirm-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDeleteTarget(null)}>
          <div className="dashboard-confirm"><AlertTriangle /><h3>Delete this card?</h3><p>“{deleteTarget.name}” and its uploaded images will be permanently removed.</p><div><button className="secondary" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="primary danger-confirm" onClick={removeCard} disabled={busyId === String(deleteTarget.id)}>Delete card</button></div></div>
        </div>
      ) : null}
    </div>
  );
}
