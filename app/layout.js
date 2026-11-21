import "./globals.css";
import "./ui-ux.css";
import "./noble-visual-refresh.css";
import "./college-theme.css";
import "./noble-university-theme.css";
import "./noble-admission-beige.css";
import "./royal-cricket.css";
import GlobalBack from "@/components/GlobalBack";
import PWARegister from "@/components/PWARegister";
import PWAAppMode from "@/components/PWAAppMode";

export const metadata = {
  title: "Royal Cricket Club",
  description: "Royal Cricket Club team, finance, match and tournament management.",
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16834a",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<GlobalBack/><PWARegister/><PWAAppMode/></body></html>;
}
