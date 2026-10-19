import "./globals.css";
import "./ui-ux.css";
import "./noble-visual-refresh.css";
import "./college-theme.css";
import GlobalBack from "@/components/GlobalBack";
import PWARegister from "@/components/PWARegister";
import PWAAppMode from "@/components/PWAAppMode";

export const metadata={
  title:"Noble ERP System",
  description:"University management and attendance platform for Noble Group of Institutes",
  manifest:"/manifest.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6d3bb5",
  colorScheme: "light"
};

export default function RootLayout({children}){
  return <html lang="en"><body>{children}<GlobalBack/><PWARegister/><PWAAppMode/></body></html>;
}
