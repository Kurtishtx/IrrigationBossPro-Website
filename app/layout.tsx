import type { Metadata } from "next";
import Script from "next/script";
import Footer from "./components/Footer";
import DemoPopup from "./components/DemoPopup";
import "./globals.css";
import MetaPixel from './components/MetaPixel';

export const metadata: Metadata = {
  title: 'IrrigationBossPro | Irrigation & Sprinkler Business Software',
  description: "IrrigationBossPro is irrigation and sprinkler business software — spring startups, repairs, winterizations, scheduling, system records, automated SMS, and invoicing. $129/month, everything included.",
};


const structuredData = {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://irrigationbosspro.com/#organization","name":"IrrigationBossPro","url":"https://irrigationbosspro.com","logo":"https://irrigationbosspro.com/icon.png","description":"Irrigation and sprinkler business software for spring startups, repairs, winterizations, scheduling, system records, and invoicing."},{"@type":"WebSite","@id":"https://irrigationbosspro.com/#website","url":"https://irrigationbosspro.com","name":"IrrigationBossPro","publisher":{"@id":"https://irrigationbosspro.com/#organization"}},{"@type":"SoftwareApplication","name":"IrrigationBossPro","applicationCategory":"BusinessApplication","operatingSystem":"Web, iOS, Android","description":"Irrigation and sprinkler business software for spring startups, repairs, winterizations, scheduling, system records, and invoicing.","offers":{"@type":"Offer","price":"129","priceCurrency":"USD","description":"$129/month flat — everything included, 14-day free trial."},"publisher":{"@id":"https://irrigationbosspro.com/#organization"}}]};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
        {/* Meta Pixel — builds the retargeting audience. Inert until
            NEXT_PUBLIC_META_PIXEL_ID is set on the Vercel project. */}
        <MetaPixel />
        <DemoPopup />
        <Footer />
        <Script
          src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
