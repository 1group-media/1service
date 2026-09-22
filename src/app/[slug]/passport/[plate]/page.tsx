'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ShieldCheck, Calendar, Wrench, ChevronLeft, Award } from 'lucide-react';
import { VehicleServicePassport } from '@/types';

export default function VehiclePassportPage({
  params,
}: {
  params: Promise<{ slug: string; plate: string }>;
}) {
  const { slug, plate } = use(params);
  const [passport, setPassport] = useState<VehicleServicePassport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPassport() {
      try {
        const res = await fetch(`/api/service/${slug}/passport/${plate}`);
        const data = await res.json();
        if (data.success) {
          setPassport(data.passport);
        }
      } catch (err) {
        console.error('Error loading passport:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPassport();
  }, [slug, plate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href={`/${slug}`}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ChevronLeft className="w-4 h-4" /> Volver al Portal de Servicio
      </Link>

      {/* Header Badge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Award className="w-32 h-32 text-amber-400" />
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" /> Pasaporte de Mantenimiento Verificado
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold font-mono text-white tracking-tight">{plate.toUpperCase()}</h1>
            <p className="text-sm font-medium text-slate-300 mt-1">
              {passport ? passport.vehicleModel : 'Vehículo Registrado'}
            </p>
          </div>
          {passport && passport.currentMileage > 0 && (
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Kilometraje Registrado</span>
              <span className="text-lg font-bold text-white font-mono">
                {passport.currentMileage.toLocaleString()} km
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Next Maintenance Alert */}
      {passport?.nextServiceMileage && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 block">Próximo Mantenimiento Recomendado</span>
            <p className="text-xs text-slate-200 mt-0.5">
              {passport.nextServiceDescription || 'Servicio Preventivo'} a los{' '}
              <strong className="text-white font-mono">{passport.nextServiceMileage.toLocaleString()} km</strong>
            </p>
          </div>
        </div>
      )}

      {/* Service History Timeline */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Historial de Servicios</h2>
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500">Cargando historial...</div>
        ) : !passport || passport.serviceHistory.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            Aún no hay servicios completados registrados para este vehículo.
          </div>
        ) : (
          <div className="space-y-3">
            {passport.serviceHistory.map((rec, i) => (
              <div
                key={rec.jobId || i}
                className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-white">{rec.workshopName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(rec.date).toLocaleDateString('es-VE')}
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-medium">{rec.serviceSummary}</p>

                {rec.partsReplaced && rec.partsReplaced.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rec.partsReplaced.map((part, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span>Odómetro: {rec.mileage > 0 ? `${rec.mileage.toLocaleString()} km` : 'N/A'}</span>
                  <span className="font-bold text-slate-300">${rec.totalUsd.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
