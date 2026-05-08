import type { Metadata } from "next";
import Login from "@/app/components/reuseModule/login";

export const metadata: Metadata = {
  title: "Inventory Management & GST Billing App for Shops in India",
  description:
    "Use Mera Dukan Mera Godam to manage inventory, track stock, monitor sales, handle expiry alerts and create GST invoices for your shop or warehouse.",
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Mera Dukan Mera Godam",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Inventory management, stock control, sales tracking and GST billing software for shops and small businesses in India.",
    areaServed: "IN",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    featureList: [
      "Inventory management",
      "Stock tracking",
      "GST invoice generation",
      "Expiry alerts",
      "Sales history",
      "Shop profile management",
      "Product database",
      "Business reporting",
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Login />
    </main>
  );
}
