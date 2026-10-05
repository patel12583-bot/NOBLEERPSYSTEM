import "./globals.css";

export const metadata={
  title:"Noble ERP System",
  description:"University management and attendance platform for Noble Group of Institutes"
};

export default function RootLayout({children}){
  return <html lang="en"><body>{children}</body></html>;
}