import type { Metadata, Viewport } from 'next';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import './globals.css';
export const metadata: Metadata = { title: 'Google Pay UI · Demo', description: 'Interactive UPI QR payment prototype. Simulated payments only; no money is transferred. Not affiliated with Google.', manifest: '/manifest.webmanifest', appleWebApp: { capable: true, title: 'Pay Demo', statusBarStyle: 'default' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#b1e7fb' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
