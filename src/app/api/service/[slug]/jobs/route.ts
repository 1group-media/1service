import { NextRequest, NextResponse } from 'next/server';
import { getWorkshopJobsFromDb, persistJobToDb } from '@/lib/db/repo';
import { ServiceJobOrder, ServiceJobStatus } from '@/types';

const DEFAULT_BCV_RATE = 852.42;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get('status') as ServiceJobStatus) || undefined;

  try {
    const jobs = await getWorkshopJobsFromDb(slug, status);
    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al consultar órdenes de trabajo', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const body = await req.json();
    const {
      customerCedula,
      customerName,
      customerPhone,
      vehiclePlate,
      vehicleModel,
      currentMileage,
      reportedIssue,
      items = [],
      bcvRate = DEFAULT_BCV_RATE,
      depositRequiredUsd = 0,
      warrantyDays = 30,
    } = body;

    if (!customerCedula || !vehiclePlate || !vehicleModel || !reportedIssue) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos requeridos: Cédula, Placa, Modelo del vehículo y Falla reportada',
        },
        { status: 400 }
      );
    }

    const cleanPlate = vehiclePlate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanCedula = customerCedula.trim().replace(/\D/g, '');

    const totalUsd = items.reduce(
      (sum: number, it: any) => sum + (parseFloat(it.priceUsd) || 0) * (parseInt(it.quantity) || 1),
      0
    );
    const totalVes = Math.round(totalUsd * bcvRate * 100) / 100;
    const jobId = `job_${Date.now()}_${cleanPlate.slice(-4)}`;

    const newJob: ServiceJobOrder = {
      id: jobId,
      workshopSlug: slug,
      customerCedula: cleanCedula,
      customerName: customerName.trim() || `Cliente V-${cleanCedula}`,
      customerPhone: customerPhone.trim() || '',
      vehiclePlate: cleanPlate,
      vehicleModel: vehicleModel.trim(),
      currentMileage: parseInt(currentMileage) || 0,
      reportedIssue: reportedIssue.trim(),
      status: items.length > 0 ? 'quoted' : 'intake',
      items,
      totalUsd,
      totalVes,
      bcvRate,
      depositRequiredUsd: parseFloat(depositRequiredUsd) || 0,
      depositPaidUsd: 0,
      paymentStatus: 'unpaid',
      warrantyDays: parseInt(warrantyDays) || 30,
      createdAt: new Date().toISOString(),
    };

    await persistJobToDb(newJob);

    return NextResponse.json({
      success: true,
      job: newJob,
      message: `Orden de servicio #${jobId} creada exitosamente`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al registrar orden de servicio', details: String(error) },
      { status: 500 }
    );
  }
}
