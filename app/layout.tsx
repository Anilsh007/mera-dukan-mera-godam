import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/components/theme/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://meradukanmeragodam.com"),
  title: {
    default: "Mera Dukan Mera Godam | Inventory Management, Stock Control & GST Billing App",
    template: "%s | Mera Dukan Mera Godam",
  },
  description:
    "Mera Dukan Mera Godam is an inventory management, stock tracking and GST billing app for kirana shops, wholesalers, retailers and small businesses in India.",
  keywords: [
    "inventory management app",
    "stock management app",
    "inventory software India",
    "GST billing app",
    "GST invoice software",
    "shop inventory management",
    "retail inventory software",
    "warehouse stock management",
    "small business inventory app",
    "kirana store software",
    "product stock tracker",
    "inventory and billing software",
    "stock entry and sales tracking",
    "inventory dashboard",
    "store management app India",
    "business inventory tracker",
    "billing and inventory app",
    "inventory management system",
    "stock control software",
    "inventory app for shopkeepers",
  ],
  applicationName: "Mera Dukan Mera Godam",
  category: "business",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Mera Dukan Mera Godam",
    title: "Mera Dukan Mera Godam | Inventory Management, Stock Control & GST Billing App",
    description:
      "Manage stock, track sales, create GST invoices and organize shop inventory from one dashboard.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mera Dukan Mera Godam | Inventory Management & GST Billing App",
    description:
      "Inventory management, stock tracking and GST billing for Indian shops, retailers and small businesses.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/fevicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ✅ data-theme HATA DIYA — yeh hardcoded "light" theme lock kar deta tha
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
