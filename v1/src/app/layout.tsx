import "./globals.css";
import { createRootMetadata } from "@/features/marketing/lib/metadata";

export const metadata = createRootMetadata();

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
