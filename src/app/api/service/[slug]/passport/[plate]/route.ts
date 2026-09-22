import { NextRequest, NextResponse } from 'next/server';
import { getPassportByPlateFromDb } from '@/lib/db/repo';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; plate: string }> }
) {
  const { plate } = await params;
  try {
    const passport = await getPassportByPlateFromDb(plate);
    if (!passport) {
      return NextResponse.json(
        {
          success: false,
          error: `No se encontró Libreta de Servicio para la placa ${plate.toUpperCase()}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, passport });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al consultar Libreta de Mantenimiento', details: String(error) },
      { status: 500 }
    );
  }
}
