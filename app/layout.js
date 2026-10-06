import "./globals.css";

export const metadata={
  title:"Noble ERP System",
  description:"University management and attendance platform for Noble Group of Institutes",manifest:"/manifest.webmanifest",themeColor:"#0b5cff"
};

export default function RootLayout({children}){
  return <html lang="en"><body>{children}</body></html>;
}