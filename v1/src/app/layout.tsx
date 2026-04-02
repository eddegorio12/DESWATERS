import "./globals.css";
import { Newsreader, Public_Sans } from "next/font/google";
import { createRootMetadata } from "@/features/marketing/lib/metadata";

export const metadata = createRootMetadata();

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased [scroll-behavior:smooth] ${publicSans.variable} ${newsreader.variable}`}
    >
      <body className="dwds-app min-h-full flex flex-col">{children}</body>
    </html>
  );
}
