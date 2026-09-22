import { NextRequest, NextResponse } from 'next/server';
import {
  getJobByIdFromDb,
  persistJobToDb,
  queryBankPaymentFromDb,
  markBankPaymentClaimedInDb,
  recordJobToPassportInDb,
} from '@/lib/db/repo';

export async function POST(
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
    const { reference, paymentMethod = 'pago_movil', amountUsd, isDeposit = false } = body;

    const cleanRef = String(reference || '').trim();

    if (paymentMethod === 'pago_movil') {
      if (!cleanRef || cleanRef.length < 4) {
        return NextResponse.json(
          { success: false, error: 'Referencia bancaria requerida (al menos 4 dígitos)' },
          { status: 400 }
        );
      }

      // Query PostgreSQL bank_payments table (0 Firestore calls!)
      const payment = await queryBankPaymentFromDb({
        reference: cleanRef,
        storeId: slug,
        amount: amountUsd,
      });

      if (!payment || !payment.verified) {
        return NextResponse.json(
          {
            success: false,
            error: 'Pago no encontrado en 1pay aún. Asegúrate de haber completado el Pago Móvil.',
          },
          { status: 400 }
        );
      }

      await markBankPaymentClaimedInDb(payment.reference || cleanRef, job.id);
      job.paymentReference = payment.reference || cleanRef;
    }

    const paidAmt = parseFloat(amountUsd) || (isDeposit ? job.depositRequiredUsd : job.totalUsd);

    if (isDeposit) {
      job.depositPaidUsd = Math.round((job.depositPaidUsd + paidAmt) * 100) / 100;
      job.paymentStatus = job.depositPaidUsd >= job.totalUsd ? 'fully_paid' : 'deposit_paid';
      if (job.status === 'quoted') job.status = 'approved';
    } else {
      job.depositPaidUsd = job.totalUsd;
      job.paymentStatus = 'fully_paid';
    }

    job.paymentMethod = paymentMethod;
    await persistJobToDb(job);

    return NextResponse.json({
      success: true,
      job,
      message: `Pago de $${paidAmt.toFixed(2)} registrado exitosamente. Estado: ${job.paymentStatus}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error procesando pago de servicio', details: String(error) },
      { status: 500 }
    );
  }
}
