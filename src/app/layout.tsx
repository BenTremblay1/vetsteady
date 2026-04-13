import type { Metadata } from 'next';
import './globals.css';
import PostHogProvider from '@/components/providers/PostHogProvider';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: {
    default: 'VetSteady — Every appointment counts',
    template: '%s | VetSteady',
  },
  description:
    'Scheduling and SMS reminders for small veterinary practices. Reduce no-shows by up to 30%.',
  openGraph: {
    title: 'VetSteady',
    description: 'Keep your practice running. Every appointment counts.',
    url: 'https://vetsteady.com',
    siteName: 'VetSteady',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
