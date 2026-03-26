import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DEGORIO WATER DISTRIBUTION SERVICES",
    template: "%s",
  },
  description:
    "DEGORIO WATER DISTRIBUTION SERVICES is a water utility operations platform for customer records, metering, billing, cashiering, and collections reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased [scroll-behavior:smooth]">
      <body className="dwds-app min-h-full flex flex-col">{children}</body>
    </html>
  );
}
