export const clerkAppearance = {
  elements: {
    card: "border border-border bg-card shadow-none",
    cardBox: "shadow-none",
    headerTitle: "text-foreground text-2xl font-semibold",
    headerSubtitle: "text-muted-foreground",
    formFieldLabel: "text-sm font-medium text-foreground",
    formFieldInput:
      "h-11 rounded-lg border-input bg-background text-foreground shadow-none",
    footerActionLink: "text-primary hover:text-primary/80",
    socialButtonsBlockButton:
      "h-11 rounded-lg border-border bg-background text-foreground shadow-none hover:bg-muted",
    formButtonPrimary:
      "h-11 rounded-lg bg-primary text-primary-foreground shadow-none hover:bg-primary/90",
    identityPreviewText: "text-foreground",
    formFieldSuccessText: "text-foreground",
    otpCodeFieldInput:
      "h-11 w-11 rounded-lg border-input bg-background text-foreground shadow-none",
  },
  layout: {
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "blockButton" as const,
  },
};
