"use client";

import dynamic from "next/dynamic";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { pushAdminHandler } from "@/lib/admin-signal";
import type { AdminDashboardData } from "@/features/wall/admin-panel";

const AdminPanel = dynamic(() => import("@/features/wall/admin-panel").then((m) => ({ default: m.AdminPanel })), { ssr: false, loading: () => null });

export function GlobalAdminPanel() {
  const { isAuthenticated } = useConvexAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => pushAdminHandler(() => setOpen(true)), []);

  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open]);

  const adminAccess = useQuery(api.admin.getAccess, isAuthenticated ? {} : "skip") as { isAdmin: boolean } | undefined;
  const adminDashboard = useQuery(api.admin.getDashboard, open && adminAccess?.isAdmin ? {} : "skip") as AdminDashboardData | undefined;

  const adminSetCardStatus = useMutation(api.admin.setCardStatus);
  const adminRemoveCard = useMutation(api.admin.removeCard);
  const adminPurgeOrphanCardData = useMutation(api.admin.purgeOrphanCardData);
  const adminDeleteCardsByOwner = useMutation(api.admin.deleteAllCardsByOwner);
  const adminResetRateLimitsForUser = useMutation(api.admin.resetRateLimitsForUser);
  const adminBlockUser = useMutation(api.admin.blockUser);
  const adminUnblockUser = useMutation(api.admin.unblockUser);
  const adminVerifyUser = useMutation(api.admin.setUserVerified);
  const adminResolveReport = useMutation(api.admin.resolveReport);
  const adminResolveBugReport = useMutation(api.admin.resolveBugReport);
  const adminResolveContactMessage = useMutation(api.admin.resolveContactMessage);
  const adminApproveVerification = useMutation(api.admin.approveVerification);
  const adminRejectVerification = useMutation(api.admin.rejectVerification);

  if (!open || !adminAccess?.isAdmin) return null;

  return (
    <AdminPanel
      data={adminDashboard}
      onClose={() => setOpen(false)}
      onSetCardStatus={async (cardId, status) => {
        await adminSetCardStatus({ cardId, status });
      }}
      onDeleteCard={async (cardId) => {
        await adminRemoveCard({ cardId });
      }}
      onPurgeOrphanCardData={async () => {
        await adminPurgeOrphanCardData();
      }}
      onDeleteCardsByOwner={async (userId) => {
        await adminDeleteCardsByOwner({ userId });
      }}
      onResetRateLimitsForUser={async (userId) => {
        await adminResetRateLimitsForUser({ userId });
      }}
      onBlockUser={async (userId) => {
        await adminBlockUser({ userId });
      }}
      onUnblockUser={async (userId, restoreCards) => {
        await adminUnblockUser({ userId, restoreCards });
      }}
      onVerifyUser={async (userId, verified) => {
        await adminVerifyUser({ userId, verified });
      }}
      onResolveReport={async (reportId) => {
        await adminResolveReport({ reportId });
      }}
      onResolveBugReport={async (bugReportId) => {
        await adminResolveBugReport({ bugReportId });
      }}
      onResolveContactMessage={async (contactMessageId) => {
        await adminResolveContactMessage({ contactMessageId });
      }}
      onApproveVerification={async (requestId) => {
        await adminApproveVerification({ requestId });
      }}
      onRejectVerification={async (requestId) => {
        await adminRejectVerification({ requestId });
      }}
    />
  );
}
