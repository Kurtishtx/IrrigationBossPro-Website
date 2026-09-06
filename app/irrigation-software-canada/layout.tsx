import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Irrigation Software for Canada | CAD Invoicing Built In — IrrigationBossPro',
  description:
    'Irrigation business software that works in Canada — spring start-up scheduling, fall winterization and blowout routes, sprinkler repair dispatch, backflow test records, and customer invoicing in Canadian dollars through your own Stripe account. $129/month flat, 14-day free trial.',
  alternates: { canonical: 'https://irrigationbosspro.com/irrigation-software-canada' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
