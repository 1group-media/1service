import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '1service · Taller Mecánico & Libreta de Mantenimiento Digital',
  description: 'Gestión de órdenes de servicio, presupuestos en USD/BCV y pasaporte de mantenimiento vehicular.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-950 text-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
