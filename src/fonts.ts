import { Fraunces, Geist, Geist_Mono } from "next/font/google";

// Shared font loaders for the DreamPak family. Each consumer's root
// layout.tsx imports `fontVariables()` and applies it to the html element.
export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Combined CSS variable className for the html element.
export function fontVariables() {
  return `${fraunces.variable} ${geistSans.variable} ${geistMono.variable}`;
}
