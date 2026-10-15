import "./globals.css";
export const metadata = { title: "sto2026", description: "Free Afro music generator. Afro Deep, Qhomu, Rap, Gospel, Jazz." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
