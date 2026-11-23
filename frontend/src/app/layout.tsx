import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MediCore — Hospital & Patient Care Management Platform',
  description: 'Enterprise healthcare operations, appointments, clinical encounters, and FHIR exchange.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
