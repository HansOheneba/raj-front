import type { Metadata } from "next";
import { Archivo, Saira } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { AuthDialog } from "@/components/customer/AuthDialog";
import { CustomerProvider } from "@/components/customer/CustomerProvider";
import { Footer } from "@/components/layout/Footer";
import { StoreShell } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/Navbar";
import { SavedProvider } from "@/components/saved/SavedProvider";
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
      <body className="min-h-dvh font-sans">
        <CustomerProvider>
          <SavedProvider>
            <CartProvider>
              <StoreShell
                departments={departments}
                navbar={<Navbar departments={departments} />}
                footer={<Footer departments={departments} />}
              >
                {children}
              </StoreShell>
              <AuthDialog />
            </CartProvider>
          </SavedProvider>
        </CustomerProvider>
      </body>
    </html>
  );
}
