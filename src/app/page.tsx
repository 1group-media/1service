import Link from 'next/link';
import { Wrench, ShieldCheck, QrCode, FileText } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-6 text-amber-400">
        <Wrench className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">1service</h1>
      <p className="text-slate-400 text-sm mb-8 leading-relaxed">
        Plataforma para talleres mecánicos, órdenes de servicio digitales y libreta de mantenimiento en Venezuela.
      </p>

      <div className="w-full space-y-3">
        <Link
          href="/motozen"
          className="w-full block bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-3.5 px-4 rounded-xl transition shadow-lg shadow-amber-500/20"
        >
          Ver Portal del Cliente (MotoZen Workshop)
        </Link>
        <Link
          href="/motozen/mechanic"
          className="w-full block bg-slate-800 hover:bg-slate-700 text-white font-medium py-3.5 px-4 rounded-xl border border-slate-700 transition"
        >
          Acceso Mecánico / Recepción (Job Cards)
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-10 w-full text-left">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <ShieldCheck className="w-5 h-5 text-amber-400 mb-2" />
          <h3 className="text-xs font-semibold text-slate-200">Presupuestos Transparentes</h3>
          <p className="text-[11px] text-slate-400 mt-1">Cotiza repuestos y mano de obra en USD con conversión automática a BCV.</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <FileText className="w-5 h-5 text-blue-400 mb-2" />
          <h3 className="text-xs font-semibold text-slate-200">Pasaporte Digital</h3>
          <p className="text-[11px] text-slate-400 mt-1">Historial de servicio permanente y recordatorios de cambio de aceite.</p>
        </div>
      </div>
    </main>
  );
}
