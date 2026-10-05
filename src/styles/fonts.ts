import { Cormorant_Garamond, Manrope, Vazirmatn } from "next/font/google";

// The site's typefaces, shared by the locale layout and the root 404 (which renders its own
// <html> for paths outside both locales).

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-cormorant",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
});

/** Put on <html>: defines the CSS variables globals.css builds its font stacks from. */
export const fontVariables = `${cormorant.variable} ${manrope.variable} ${vazirmatn.variable}`;
