import type { Metadata } from "next";
import { Archivo, Saira } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { listDepartments } from "@/lib/catalog";
import { siteConfig } from "@/lib/config";

const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});

const saira = Saira({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-saira",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const departments = await listDepartments();

  return (
    <html lang="en" className={`${archivo.variable} ${saira.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <CartProvider>
          <Navbar departments={departments} />
          <main className="flex-1">{children}</main>
          <Footer departments={departments} />
        </CartProvider>
      </body>
    </html>
  );
}
