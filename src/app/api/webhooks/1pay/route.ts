import { NextRequest, NextResponse } from 'next/server';
import { db, pool } from '@/lib/db';
import { serviceJobOrders, merchants } from '@/lib/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import crypto from 'crypto';

function compute1PaySignature(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-1pay-signature') || req.headers.get('X-1Pay-Signature');

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'JSON malformado' }, { status: 400 });
    }

    const { storeId, reference, amountUsd, amountVes, customerPhone, bankName } = body;
    if (!storeId || !reference || (!amountUsd && !amountVes)) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // 1. Signature validation (if configured)
    const mRes = await db.select().from(merchants).where(eq(merchants.slug, storeId)).limit(1);
    const merchant = mRes[0];
    const secret = merchant?.webhookSecret || process.env.ONEPAY_WEBHOOK_SECRET || storeId;

    if (signature) {
      const possibleKeys = [
        merchant?.webhookSecret,
        process.env.ONEPAY_WEBHOOK_SECRET,
        storeId,
        'motozen'
      ].filter(Boolean) as string[];

      const cleanSig = signature.replace(/^sha256=/, '').trim().toLowerCase();
      const isValid = possibleKeys.some(k => compute1PaySignature(rawBody, k).toLowerCase() === cleanSig);
      if (!isValid) {
        return NextResponse.json({ error: 'Firma HMAC inválida' }, { status: 401 });
      }
    }

    const cleanRef = String(reference || '').trim();
    const cleanPhone = customerPhone ? customerPhone.replace(/\D/g, '').slice(-7) : '';

    // 2. Query pending or quoted job cards for this workshop
    const openJobs = await db.select().from(serviceJobOrders).where(
      and(
        eq(serviceJobOrders.workshopSlug, storeId),
        or(
          eq(serviceJobOrders.paymentStatus, 'unpaid'),
          eq(serviceJobOrders.paymentStatus, 'deposit_paid')
        )
      )
    ).orderBy(desc(serviceJobOrders.createdAt));

    // Match candidate by reference, phone, or exact amount
    const candidate = openJobs.find((j) => {
      if (cleanRef && j.paymentReference && j.paymentReference.includes(cleanRef)) return true;
      if (cleanPhone && j.customerPhone && j.customerPhone.replace(/\D/g, '').endsWith(cleanPhone)) return true;
      if (amountUsd && Math.abs(parseFloat(j.totalUsd) - amountUsd) < 0.5) return true;
      if (amountUsd && Math.abs(parseFloat(j.depositRequiredUsd) - amountUsd) < 0.5) return true;
      return false;
    });

    if (candidate) {
      const paidAmt = amountUsd ? parseFloat(amountUsd) : (parseFloat(amountVes) / 66.50);
      const newDepositPaid = Math.round((parseFloat(candidate.depositPaidUsd) + paidAmt) * 100) / 100;
      const total = parseFloat(candidate.totalUsd);
      const newPaymentStatus = newDepositPaid >= total ? 'fully_paid' : 'deposit_paid';
      const newStatus = candidate.status === 'quoted' ? 'approved' : candidate.status;

      const isApproved = newStatus === 'approved';
      await pool.query(`
        UPDATE service_job_orders
        SET
          deposit_paid_usd = $1,
          payment_status = $2,
          status = $3,
          payment_reference = $4,
          payment_method = 'pago_movil',
          approved_at = CASE WHEN CAST($5 AS boolean) = true AND approved_at IS NULL THEN NOW() ELSE approved_at END
        WHERE id = $6
      `, [newDepositPaid.toFixed(2), newPaymentStatus, newStatus, cleanRef, isApproved, candidate.id]);

      // If parts needed, auto-dispatch a parts run on 1delivery
      if (newStatus === 'approved' && candidate.reportedIssue && candidate.reportedIssue.toLowerCase().includes('repuesto')) {
        const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await pool.query(`
          INSERT INTO delivery_runs (
            id, type, store_slug, job_id, pickup_address, delivery_address,
            delivery_zone, recipient_name, recipient_phone, package_description,
            delivery_fee_usd, delivery_fee_ves, bcv_rate, status, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending_dispatch', $14, NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          runId,
          'service_parts_run',
          storeId,
          candidate.id,
          'Auto Repuestos El Tigre, Av. Mérida, Anaco',
          'Taller MotoZen ADV, Galpón #4, Zona Industrial Anaco',
          'Zona Industrial',
          candidate.customerName,
          candidate.customerPhone,
          `Repuestos urgentes para orden de servicio #${candidate.id} (${candidate.vehiclePlate})`,
          3.50,
          (3.50 * 66.50).toFixed(2),
          66.50,
          'Despachado automáticamente tras aprobación de cotización por Pago Móvil'
        ]).catch(console.error);
      }

      return NextResponse.json({
        success: true,
        action: 'matched',
        jobId: candidate.id,
        vehiclePlate: candidate.vehiclePlate,
        paymentStatus: newPaymentStatus,
        status: newStatus,
        depositPaidUsd: newDepositPaid,
        message: `Orden #${candidate.id} (${candidate.vehiclePlate}) actualizada por Pago Móvil Ref #${cleanRef}`
      });
    }

    return NextResponse.json({
      success: true,
      action: 'unmatched',
      message: `Pago Móvil Ref #${cleanRef} registrado en 1pay (sin orden de taller pendiente directa)`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
