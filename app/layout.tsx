import type { Metadata } from 'next';
import './globals.css';
import './direction-fix.css';

export const metadata: Metadata = {
  title: 'በረከት — የንግድ ማዕከል',
  description: 'የእርሻ እና የመጠጥ ንግድዎን በአንድ ቦታ ያስተዳድሩ።',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="am" dir="ltr"><body>{children}</body></html>;
}
