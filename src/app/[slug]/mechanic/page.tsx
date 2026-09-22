'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Wrench, Plus, CheckCircle, Clock, FileText, ChevronRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { ServiceJobOrder, ServiceJobStatus } from '@/types';

export default function MechanicDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [jobs, setJobs] = useState<ServiceJobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'new'>('active');

  // Intake Form state
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [mileage, setMileage] = useState('');
  const [issue, setIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Selected Job modal for editing quote / status
  const [selectedJob, setSelectedJob] = useState<ServiceJobOrder | null>(null);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemType, setNewItemType] = useState<'part' | 'labor'>('part');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/service/${slug}/jobs`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [slug]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !model || !cedula || !issue) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/service/${slug}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehiclePlate: plate,
          vehicleModel: model,
          customerCedula: cedula,
          customerPhone: phone,
          currentMileage: mileage,
          reportedIssue: issue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPlate('');
        setModel('');
        setCedula('');
        setPhone('');
        setMileage('');
        setIssue('');
        setActiveTab('active');
        fetchJobs();
      }
    } catch (err) {
      console.error('Error creating job:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (jobId: string, status: ServiceJobStatus) => {
    try {
      const res = await fetch(`/api/service/${slug}/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, workshopName: 'MotoZen Workshop' }),
      });
      const data = await res.json();
      if (data.success) {
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob(data.job);
        }
        fetchJobs();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAddItemToJob = async () => {
    if (!selectedJob || !newItemDesc || !newItemPrice) return;
    const priceUsd = parseFloat(newItemPrice);
    const quantity = parseInt(newItemQty) || 1;

    const updatedItems = [
      ...selectedJob.items,
      {
        id: `item_${Date.now()}`,
        type: newItemType,
        description: newItemDesc,
        priceUsd,
        quantity,
      },
    ];

    try {
      const res = await fetch(`/api/service/${slug}/jobs/${selectedJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedJob(data.job);
        setNewItemDesc('');
        setNewItemPrice('');
        fetchJobs();
      }
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const statusBadges: Record<ServiceJobStatus, { label: string; color: string }> = {
    intake: { label: 'Recepción', color: 'bg-slate-700 text-slate-200' },
    diagnosing: { label: 'Diagnóstico', color: 'bg-purple-900/60 text-purple-300 border border-purple-700' },
    quoted: { label: 'Presupuestado', color: 'bg-blue-900/60 text-blue-300 border border-blue-700' },
    approved: { label: 'Aprobado', color: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' },
    in_progress: { label: 'En Taller', color: 'bg-amber-900/60 text-amber-300 border border-amber-700' },
    ready: { label: 'Listo p/ Entrega', color: 'bg-cyan-900/60 text-cyan-300 border border-cyan-700' },
    delivered: { label: 'Entregado', color: 'bg-green-900/60 text-green-300 border border-green-700' },
    cancelled: { label: 'Cancelado', color: 'bg-red-900/60 text-red-300 border border-red-700' },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Panel Mecánico & Recepción</h1>
            <p className="text-xs text-slate-400">Taller: {slug.toUpperCase()} · Anaco, Anzoátegui</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchJobs}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href={`/${slug}`}
            className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg text-slate-300"
          >
            Ver Vista Cliente
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 my-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition ${
            activeTab === 'active'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          Órdenes Activas ({jobs.filter((j) => j.status !== 'delivered' && j.status !== 'cancelled').length})
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition ${
            activeTab === 'new'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          + Nueva Recepción
        </button>
      </div>

      {activeTab === 'new' ? (
        /* Intake Form */
        <form onSubmit={handleCreateJob} className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-200 mb-2">Ingreso de Vehículo / Moto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Placa / Identificador *</label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="Ej. AA1B23C o MOTO-01"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm uppercase text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Modelo del Vehículo *</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ej. Ducati DesertX / Yamaha XT660"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Cédula del Propietario *</label>
              <input
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Ej. 18999888"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Teléfono WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 04121234567"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Kilometraje Actual (km)</label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="Ej. 14500"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Falla Reportada / Trabajo Requerido *</label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Ej. Cambio de aceite y filtro. Revisar chirrido en freno delantero y tensión de cadena."
              rows={3}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition"
          >
            {submitting ? 'Creando Orden...' : 'Crear Orden de Servicio'}
          </button>
        </form>
      ) : (
        /* Jobs List */
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Cargando órdenes...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6">
              <p className="text-slate-400 text-sm">No hay órdenes de servicio registradas aún.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-mono text-xs font-bold shrink-0">
                    {job.vehiclePlate.slice(-4)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-amber-400">{job.vehiclePlate}</span>
                      <span className="text-xs text-slate-300">· {job.vehicleModel}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusBadges[job.status].color}`}>
                        {statusBadges[job.status].label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{job.reportedIssue}</p>
                    <div className="flex gap-3 text-[11px] text-slate-500 mt-1">
                      <span>Cliente: {job.customerName}</span>
                      {job.currentMileage > 0 && <span>· {job.currentMileage.toLocaleString()} km</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-right">
                    <span className="block font-bold text-base text-white">${job.totalUsd.toFixed(2)}</span>
                    <span className="block text-[11px] text-slate-400">
                      Bs. {job.totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail & Quote Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold">{selectedJob.vehiclePlate}</span>
                <h3 className="text-base font-bold text-white">{selectedJob.vehicleModel}</h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Status Pipeline Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Estado del Trabajo</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['diagnosing', 'quoted', 'in_progress', 'ready', 'delivered'] as ServiceJobStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedJob.id, st)}
                    className={`py-2 px-2.5 rounded-lg font-semibold text-center transition ${
                      selectedJob.status === st
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {statusBadges[st].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Items list */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-2">Ítems Cotizados (Repuestos + Mano de Obra)</h4>
              {selectedJob.items.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Sin ítems cotizados todavía.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedJob.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg text-xs">
                      <div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono mr-2 ${it.type === 'part' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'}`}>
                          {it.type === 'part' ? 'REPUESTO' : 'LABOR'}
                        </span>
                        <span>{it.description} (x{it.quantity})</span>
                      </div>
                      <span className="font-bold text-slate-200">${(it.priceUsd * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Item Form */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-slate-300 block">+ Agregar Repuesto o Mano de Obra</span>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={newItemType}
                  onChange={(e: any) => setNewItemType(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-2 text-white"
                >
                  <option value="part">Repuesto</option>
                  <option value="labor">Mano de Obra</option>
                </select>
                <input
                  type="number"
                  placeholder="Precio USD"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Cant."
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-2 text-white"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Descripción (ej. Motul 7100 4L o Cambio de pastillas)"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 text-white"
                />
                <button
                  onClick={handleAddItemToJob}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Link to Passport and WhatsApp Share */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex items-center gap-3">
                <Link
                  href={`/${slug}/passport/${selectedJob.vehiclePlate}`}
                  target="_blank"
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" /> Pasaporte {selectedJob.vehiclePlate}
                </Link>
                <a
                  href={`https://wa.me/${selectedJob.customerPhone ? selectedJob.customerPhone.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(`¡Hola ${selectedJob.customerName}! Tu cotización en ${slug.toUpperCase()} para ${selectedJob.vehicleModel} (${selectedJob.vehiclePlate}) está lista por $${selectedJob.totalUsd} USD. Revísala aquí: https://service.1group.media/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <span>💬</span> Enviar por WhatsApp
                </a>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="bg-slate-800 text-white text-xs px-4 py-2 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
