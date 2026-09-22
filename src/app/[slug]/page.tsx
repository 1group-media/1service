'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Wrench, CheckCircle, Clock, ShieldCheck, FileText, ChevronRight, AlertCircle, Copy, Check } from 'lucide-react';
import { ServiceJobOrder, ServiceJobStatus } from '@/types';

export default function CustomerPortal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [cedulaOrPlate, setCedulaOrPlate] = useState('18999888');
  const [jobs, setJobs] = useState<ServiceJobOrder[]>([]);
  const [selectedJob, setSelectedJob] = useState<ServiceJobOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Payment state
  const [payRef, setPayRef] = useState('');
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const searchJobs = async (term?: string) => {
    const query = term || cedulaOrPlate;
    if (!query) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/service/${slug}/jobs`);
      const data = await res.json();
      if (data.success) {
        const cleanQuery = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const matched = (data.jobs as ServiceJobOrder[]).filter(
          (j) =>
            j.customerCedula.replace(/\D/g, '') === cleanQuery ||
            j.vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanQuery
        );
        setJobs(matched);
        if (matched.length > 0) {
          setSelectedJob(matched[0]);
        } else {
          setSelectedJob(null);
        }
      }
    } catch (err) {
      console.error('Error searching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchJobs('18999888');
  }, [slug]);

  const handleApproveQuote = async (jobId: string) => {
    try {
      const res = await fetch(`/api/service/${slug}/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_quote' }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedJob(data.job);
        searchJobs();
      }
    } catch (err) {
      console.error('Error approving quote:', err);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedJob || !payRef) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch(`/api/service/${slug}/jobs/${selectedJob.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: payRef,
          paymentMethod: 'pago_movil',
          amountUsd: selectedJob.totalUsd,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaySuccess(true);
        setSelectedJob(data.job);
        searchJobs();
      } else {
        setPayError(data.error || 'Pago no verificado');
      }
    } catch (err) {
      setPayError('Error conectando al servidor de pagos');
    } finally {
      setPaying(false);
    }
  };

  const copyPagoMovil = () => {
    navigator.clipboard.writeText('0134 04121234567 18999888');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps: { key: ServiceJobStatus; label: string }[] = [
    { key: 'intake', label: 'Ingreso' },
    { key: 'quoted', label: 'Presupuesto' },
    { key: 'approved', label: 'Aprobado' },
    { key: 'in_progress', label: 'En Taller' },
    { key: 'ready', label: 'Listo' },
    { key: 'delivered', label: 'Entregado' },
  ];

  const getStepIndex = (st: ServiceJobStatus) => {
    if (st === 'diagnosing') return 1;
    const idx = steps.findIndex((s) => s.key === st);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Portal de Servicio & Taller</h1>
            <p className="text-xs text-slate-400">Taller Autorizado: {slug.toUpperCase()}</p>
          </div>
        </div>
        <Link
          href={`/${slug}/mechanic`}
          className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
        >
          Acceso Taller
        </Link>
      </div>

      {/* Search Input */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
        <label className="text-xs font-semibold text-slate-400 block">Consulta tu Reparación por Cédula o Placa</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={cedulaOrPlate}
            onChange={(e) => setCedulaOrPlate(e.target.value)}
            placeholder="Ej. 18999888 o AA1B23C"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
          />
          <button
            onClick={() => searchJobs()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Job Card Details */}
      {selectedJob ? (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
          {/* Top Info */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {selectedJob.vehiclePlate}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{selectedJob.vehicleModel}</h2>
              <p className="text-xs text-slate-400">Orden #{selectedJob.id} · Ingreso: {new Date(selectedJob.createdAt).toLocaleDateString('es-VE')}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">${selectedJob.totalUsd.toFixed(2)}</span>
              <span className="block text-xs text-slate-400">
                Bs. {selectedJob.totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Progress Timeline */}
          <div>
            <div className="flex justify-between items-center text-[11px] font-medium text-slate-400 mb-2">
              {steps.map((s, idx) => (
                <span
                  key={s.key}
                  className={`${idx <= getStepIndex(selectedJob.status) ? 'text-amber-400 font-bold' : 'text-slate-600'}`}
                >
                  {s.label}
                </span>
              ))}
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${((getStepIndex(selectedJob.status) + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Reported Issue */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Motivo de Ingreso:</span>
            <p className="text-sm text-slate-200">{selectedJob.reportedIssue}</p>
          </div>

          {/* Items Quote */}
          {selectedJob.items.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Detalle del Presupuesto</h3>
              <div className="space-y-2">
                {selectedJob.items.map((it) => (
                  <div key={it.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 text-xs">
                    <div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono mr-2 ${it.type === 'part' ? 'bg-blue-900/60 text-blue-300' : 'bg-purple-900/60 text-purple-300'}`}>
                        {it.type === 'part' ? 'REPUESTO' : 'LABOR'}
                      </span>
                      <span>{it.description} (x{it.quantity})</span>
                    </div>
                    <span className="font-bold text-white">${(it.priceUsd * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action: Approve Quote Button */}
          {selectedJob.status === 'quoted' && (
            <button
              onClick={() => handleApproveQuote(selectedJob.id)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle className="w-5 h-5" /> Aprobar Presupuesto
            </button>
          )}

          {/* Settlement / Pago Móvil Section */}
          {selectedJob.paymentStatus !== 'fully_paid' && selectedJob.status !== 'intake' && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Pagar con Pago Móvil</h4>
                  <p className="text-xs text-slate-400">Verificación instantánea vía 1pay</p>
                </div>
                <button
                  onClick={copyPagoMovil}
                  className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar Datos'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800 font-mono">
                <div>Banco: <span className="text-white font-bold">Banesco (0134)</span></div>
                <div>Teléfono: <span className="text-white font-bold">0412-1234567</span></div>
                <div>RIF/Cédula: <span className="text-white font-bold">V-18999888</span></div>
                <div>Monto: <span className="text-amber-400 font-bold">Bs. {selectedJob.totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span></div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">Número de Referencia Bancaria</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="Ej. 782910 o últimos 4 dígitos"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                  />
                  <button
                    onClick={handleProcessPayment}
                    disabled={paying || !payRef}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition"
                  >
                    {paying ? 'Verificando...' : 'Confirmar'}
                  </button>
                </div>
                {payError && <p className="text-xs text-red-400">{payError}</p>}
                {paySuccess && <p className="text-xs text-emerald-400 font-semibold">¡Pago verificado exitosamente!</p>}
              </div>
            </div>
          )}

          {/* Digital Service Passport Link */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <Link
              href={`/${slug}/passport/${selectedJob.vehiclePlate}`}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1.5 font-medium"
            >
              <FileText className="w-4 h-4" /> Libreta de Mantenimiento Digital de esta Placa
            </Link>
            <span className="text-[11px] text-slate-500">Garantía: {selectedJob.warrantyDays} días</span>
          </div>
        </div>
      ) : searched && !loading ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6 space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No se encontraron órdenes activas</h3>
          <p className="text-xs text-slate-400">Verifica la Cédula o Placa ingresada o consulta directamente con el taller.</p>
        </div>
      ) : null}
    </div>
  );
}
