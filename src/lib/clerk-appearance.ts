const font = {
  fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
  fontSize: "13px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
} as const;

const iconBox = {
  width: "20px",
  minWidth: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const;

const actionBtn = {
  borderRadius: "0",
  padding: "11px 16px",
  borderBottom: "1px solid var(--ui-border-3)",
  gap: "10px",
  ...font,
} as const;

export const clerkUserButtonAppearance = {
  variables: {
    colorBackground: "var(--ui-bg)",
    colorText: "#141414",
    colorTextSecondary: "#666",
    colorPrimary: "#f43d38",
    colorDanger: "#f43d38",
    borderRadius: "0rem",
  },
  elements: {
    userButtonPopoverCard: {
      boxShadow: "6px 10px 32px #0008",
      borderTop: "2px solid #f43d38",
      borderRadius: "0",
      minWidth: "220px",
    },
    userButtonPopoverMain: {
      background: "var(--ui-bg)",
      borderBottom: "1px solid var(--ui-border)",
      padding: "14px 16px 12px",
    },
    userButtonPopoverActions: {
      padding: "0",
      background: "var(--ui-bg)",
    },
    // Built-in items (manageAccount, signOut)
    userButtonPopoverActionButton: actionBtn,
    userButtonPopoverActionButtonIconBox: iconBox,
    // Custom items (My board, Dark mode)
    userButtonPopoverCustomItemButton: actionBtn,
    userButtonPopoverCustomItemButtonIconBox: iconBox,
    userButtonPopoverFooter: { display: "none" },
  },
} as const;
