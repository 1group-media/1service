import { NextRequest, NextResponse } from 'next/server';
import { getJobByIdFromDb, persistJobToDb, recordJobToPassportInDb } from '@/lib/db/repo';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { id } = await params;
  try {
    const job = await getJobByIdFromDb(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Orden de servicio no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, job });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al consultar orden de servicio', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  try {
    const job = await getJobByIdFromDb(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Orden de servicio no encontrada' }, { status: 404 });
    }

    const body = await req.json();
    const { status, items, diagnosticNotes, action, workshopName = 'Taller Autorizado' } = body;

    // Handle customer 1-click quote approval
    if (action === 'approve_quote') {
      job.status = 'approved';
      job.approvedAt = new Date().toISOString();
    } else if (status) {
      job.status = status;
      if (status === 'ready') job.readyAt = new Date().toISOString();
      if (status === 'delivered') job.deliveredAt = new Date().toISOString();
    }

    if (diagnosticNotes !== undefined) {
      job.diagnosticNotes = diagnosticNotes;
    }

    if (items && Array.isArray(items)) {
      job.items = items;
      job.totalUsd = items.reduce(
        (sum: number, it: any) => sum + (parseFloat(it.priceUsd) || 0) * (parseInt(it.quantity) || 1),
        0
      );
      job.totalVes = Math.round(job.totalUsd * job.bcvRate * 100) / 100;
      if (job.status === 'intake') job.status = 'quoted';
    }

    await persistJobToDb(job);

    // If delivered, automatically record to the vehicle's permanent Digital Service Passport!
    if (job.status === 'delivered') {
      await recordJobToPassportInDb(job, workshopName);
    }

    return NextResponse.json({
      success: true,
      job,
      message: `Orden #${job.id} actualizada correctamente (${job.status})`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error actualizando orden de servicio', details: String(error) },
      { status: 500 }
    );
  }
}
