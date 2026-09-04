import type { Metadata } from "next";
import { Suspense } from "react";
import { Archivo, Saira } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { AuthDialog } from "@/components/customer/AuthDialog";
import { CustomerProvider } from "@/components/customer/CustomerProvider";
import { Footer } from "@/components/layout/Footer";
import { StoreShell } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/Navbar";
import { SavedProvider } from "@/components/saved/SavedProvider";
import { Toaster } from "@/components/ui/sonner";
import { getMegaMenu, listDepartments } from "@/lib/catalog";
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
  const [departments, megaMenu] = await Promise.all([listDepartments(), getMegaMenu()]);

  return (
    <html lang="en" className={`${archivo.variable} ${saira.variable}`}>
      <body className="min-h-dvh font-sans">
        <CustomerProvider>
          <SavedProvider>
            <CartProvider>
              <StoreShell
                menu={megaMenu.departments}
                navbar={
                  <Suspense
                    fallback={
                      <div className="sticky top-0 z-50 border-b border-line bg-ivory">
                        <div className="bg-ink">
                          <div className="shell h-7" />
                        </div>
                        <div className="shell h-14 lg:h-[3.75rem]" />
                        <div className="hidden h-11 lg:block" />
                      </div>
                    }
                  >
                    <Navbar departments={departments} megaMenu={megaMenu} />
                  </Suspense>
                }
                footer={<Footer departments={departments} />}
              >
                {children}
              </StoreShell>
              <AuthDialog />
              <Toaster position="top-center" closeButton />
            </CartProvider>
          </SavedProvider>
        </CustomerProvider>
      </body>
    </html>
  );
}
