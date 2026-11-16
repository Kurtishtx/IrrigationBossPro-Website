import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Videos | IrrigationBossPro',
  description: 'Short videos of every IrrigationBossPro feature: zones and backflow tests on file, routes, the crew app, invoicing, estimates, texting, AI tools and more.',
  alternates: { canonical: 'https://irrigationbosspro.com/videos' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
