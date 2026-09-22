import { db } from './index';
import {
  merchants,
  bankPayments,
  serviceJobOrders,
  vehicleServicePassports,
} from './schema';
import { eq, and, or, like, desc } from 'drizzle-orm';
import {
  ServiceJobOrder,
  VehicleServicePassport,
  ServiceJobStatus,
  PaymentStatus,
  PassportRecord,
} from '@/types';

/**
 * Queries workshop job cards from PostgreSQL
 */
export async function getWorkshopJobsFromDb(
  workshopSlug: string,
  status?: ServiceJobStatus
): Promise<ServiceJobOrder[]> {
  try {
    const condition = status
      ? and(eq(serviceJobOrders.workshopSlug, workshopSlug), eq(serviceJobOrders.status, status))
      : eq(serviceJobOrders.workshopSlug, workshopSlug);

    const rows = await db
      .select()
      .from(serviceJobOrders)
      .where(condition)
      .orderBy(desc(serviceJobOrders.createdAt));

    return rows.map((r) => ({
      id: r.id,
      workshopSlug: r.workshopSlug,
      customerCedula: r.customerCedula,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      vehiclePlate: r.vehiclePlate,
      vehicleModel: r.vehicleModel,
      currentMileage: r.currentMileage,
      reportedIssue: r.reportedIssue,
      diagnosticNotes: r.diagnosticNotes || undefined,
      status: r.status as ServiceJobStatus,
      items: (r.items as any) || [],
      totalUsd: parseFloat(r.totalUsd),
      totalVes: parseFloat(r.totalVes),
      bcvRate: parseFloat(r.bcvRate),
      depositRequiredUsd: parseFloat(r.depositRequiredUsd),
      depositPaidUsd: parseFloat(r.depositPaidUsd),
      paymentStatus: r.paymentStatus as PaymentStatus,
      paymentMethod: (r.paymentMethod as any) || undefined,
      paymentReference: r.paymentReference || undefined,
      warrantyDays: r.warrantyDays,
      createdAt: r.createdAt.toISOString(),
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : undefined,
      readyAt: r.readyAt ? r.readyAt.toISOString() : undefined,
      deliveredAt: r.deliveredAt ? r.deliveredAt.toISOString() : undefined,
    }));
  } catch (err) {
    console.error('[DB] Error fetching workshop jobs:', err);
    return [];
  }
}

/**
 * Queries a single job card by ID
 */
export async function getJobByIdFromDb(jobId: string): Promise<ServiceJobOrder | null> {
  try {
    const rows = await db
      .select()
      .from(serviceJobOrders)
      .where(eq(serviceJobOrders.id, jobId))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      workshopSlug: r.workshopSlug,
      customerCedula: r.customerCedula,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      vehiclePlate: r.vehiclePlate,
      vehicleModel: r.vehicleModel,
      currentMileage: r.currentMileage,
      reportedIssue: r.reportedIssue,
      diagnosticNotes: r.diagnosticNotes || undefined,
      status: r.status as ServiceJobStatus,
      items: (r.items as any) || [],
      totalUsd: parseFloat(r.totalUsd),
      totalVes: parseFloat(r.totalVes),
      bcvRate: parseFloat(r.bcvRate),
      depositRequiredUsd: parseFloat(r.depositRequiredUsd),
      depositPaidUsd: parseFloat(r.depositPaidUsd),
      paymentStatus: r.paymentStatus as PaymentStatus,
      paymentMethod: (r.paymentMethod as any) || undefined,
      paymentReference: r.paymentReference || undefined,
      warrantyDays: r.warrantyDays,
      createdAt: r.createdAt.toISOString(),
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : undefined,
      readyAt: r.readyAt ? r.readyAt.toISOString() : undefined,
      deliveredAt: r.deliveredAt ? r.deliveredAt.toISOString() : undefined,
    };
  } catch (err) {
    console.error('[DB] Error fetching job by ID:', err);
    return null;
  }
}

/**
 * Persists or updates a job card atomically in PostgreSQL
 */
export async function persistJobToDb(job: ServiceJobOrder): Promise<void> {
  try {
    await db
      .insert(serviceJobOrders)
      .values({
        id: job.id,
        workshopSlug: job.workshopSlug,
        customerCedula: job.customerCedula,
        customerName: job.customerName,
        customerPhone: job.customerPhone,
        vehiclePlate: job.vehiclePlate,
        vehicleModel: job.vehicleModel,
        currentMileage: job.currentMileage,
        reportedIssue: job.reportedIssue,
        diagnosticNotes: job.diagnosticNotes,
        status: job.status,
        items: JSON.stringify(job.items),
        totalUsd: job.totalUsd.toString(),
        totalVes: job.totalVes.toString(),
        bcvRate: job.bcvRate.toString(),
        depositRequiredUsd: job.depositRequiredUsd.toString(),
        depositPaidUsd: job.depositPaidUsd.toString(),
        paymentStatus: job.paymentStatus,
        paymentMethod: job.paymentMethod,
        paymentReference: job.paymentReference,
        warrantyDays: job.warrantyDays,
        approvedAt: job.approvedAt ? new Date(job.approvedAt) : null,
        readyAt: job.readyAt ? new Date(job.readyAt) : null,
        deliveredAt: job.deliveredAt ? new Date(job.deliveredAt) : null,
      })
      .onConflictDoUpdate({
        target: serviceJobOrders.id,
        set: {
          diagnosticNotes: job.diagnosticNotes,
          status: job.status,
          items: JSON.stringify(job.items),
          totalUsd: job.totalUsd.toString(),
          totalVes: job.totalVes.toString(),
          bcvRate: job.bcvRate.toString(),
          depositRequiredUsd: job.depositRequiredUsd.toString(),
          depositPaidUsd: job.depositPaidUsd.toString(),
          paymentStatus: job.paymentStatus,
          paymentMethod: job.paymentMethod,
          paymentReference: job.paymentReference,
          warrantyDays: job.warrantyDays,
          approvedAt: job.approvedAt ? new Date(job.approvedAt) : null,
          readyAt: job.readyAt ? new Date(job.readyAt) : null,
          deliveredAt: job.deliveredAt ? new Date(job.deliveredAt) : null,
        },
      });
  } catch (err) {
    console.error('[DB] Error persisting job order:', err);
  }
}

/**
 * Queries vehicle service passport by license plate
 */
export async function getPassportByPlateFromDb(plate: string): Promise<VehicleServicePassport | null> {
  try {
    const cleanPlate = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const rows = await db
      .select()
      .from(vehicleServicePassports)
      .where(eq(vehicleServicePassports.vehiclePlate, cleanPlate))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      vehiclePlate: r.vehiclePlate,
      vehicleModel: r.vehicleModel,
      ownerCedula: r.ownerCedula,
      currentMileage: r.currentMileage,
      serviceHistory: (r.serviceHistory as any) || [],
      nextServiceMileage: r.nextServiceMileage || undefined,
      nextServiceDate: r.nextServiceDate ? r.nextServiceDate.toISOString() : undefined,
      nextServiceDescription: r.nextServiceDescription || undefined,
      lastUpdated: r.lastUpdated.toISOString(),
    };
  } catch (err) {
    console.error('[DB] Error fetching passport by plate:', err);
    return null;
  }
}

/**
 * Persists vehicle service passport atomically
 */
export async function persistPassportToDb(passport: VehicleServicePassport): Promise<void> {
  try {
    await db
      .insert(vehicleServicePassports)
      .values({
        id: `pass_${passport.vehiclePlate}`,
        vehiclePlate: passport.vehiclePlate,
        vehicleModel: passport.vehicleModel,
        ownerCedula: passport.ownerCedula,
        currentMileage: passport.currentMileage,
        serviceHistory: JSON.stringify(passport.serviceHistory),
        nextServiceMileage: passport.nextServiceMileage,
        nextServiceDate: passport.nextServiceDate ? new Date(passport.nextServiceDate) : null,
        nextServiceDescription: passport.nextServiceDescription,
      })
      .onConflictDoUpdate({
        target: vehicleServicePassports.vehiclePlate,
        set: {
          currentMileage: passport.currentMileage,
          serviceHistory: JSON.stringify(passport.serviceHistory),
          nextServiceMileage: passport.nextServiceMileage,
          nextServiceDate: passport.nextServiceDate ? new Date(passport.nextServiceDate) : null,
          nextServiceDescription: passport.nextServiceDescription,
          lastUpdated: new Date(),
        },
      });
  } catch (err) {
    console.error('[DB] Error persisting vehicle passport:', err);
  }
}

/**
 * Automatically logs completed service job into the Vehicle's Service Passport
 */
export async function recordJobToPassportInDb(job: ServiceJobOrder, workshopName: string): Promise<void> {
  try {
    const existing = await getPassportByPlateFromDb(job.vehiclePlate);
    const partsReplaced = job.items
      .filter((i) => i.type === 'part')
      .map((i) => `${i.description} (x${i.quantity})`);

    const summary = job.items
      .filter((i) => i.type === 'labor')
      .map((i) => i.description)
      .join(', ') || job.reportedIssue;

    const record: PassportRecord = {
      jobId: job.id,
      workshopName,
      date: new Date().toISOString(),
      mileage: job.currentMileage,
      serviceSummary: summary,
      partsReplaced,
      totalUsd: job.totalUsd,
    };

    const nextKm = job.currentMileage > 0 ? job.currentMileage + 5000 : undefined;
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 3);

    const passport: VehicleServicePassport = {
      vehiclePlate: job.vehiclePlate,
      vehicleModel: job.vehicleModel,
      ownerCedula: job.customerCedula,
      currentMileage: job.currentMileage,
      serviceHistory: existing ? [record, ...existing.serviceHistory] : [record],
      nextServiceMileage: nextKm,
      nextServiceDate: nextDate.toISOString(),
      nextServiceDescription: 'Cambio de Aceite & Revisión de Filtros / Frenos',
      lastUpdated: new Date().toISOString(),
    };

    await persistPassportToDb(passport);
  } catch (err) {
    console.error('[DB] Error recording job to passport:', err);
  }
}

/**
 * Queries bank payment directly from PostgreSQL
 */
export async function queryBankPaymentFromDb(optionsOrRef: string | { reference: string; storeId?: string; amount?: number | string }): Promise<{
  verified: boolean;
  bank?: string;
  reference?: string;
  amount?: string;
  currency?: string;
  timestamp?: string;
  status?: string;
} | null> {
  try {
    const ref = typeof optionsOrRef === 'string' ? optionsOrRef : optionsOrRef.reference;
    const storeId = typeof optionsOrRef === 'object' ? optionsOrRef.storeId : undefined;
    const cleanRef = ref.trim();
    if (!cleanRef) return null;

    const refCondition =
      cleanRef.length >= 4
        ? or(eq(bankPayments.reference, cleanRef), like(bankPayments.reference, `%${cleanRef}`))
        : eq(bankPayments.reference, cleanRef);

    const rows = await db
      .select()
      .from(bankPayments)
      .where(refCondition)
      .orderBy(desc(bankPayments.createdAt))
      .limit(5);

    for (const p of rows) {
      if (storeId && p.storeSlug !== 'default' && p.storeSlug !== storeId) {
        continue;
      }
      return {
        verified: true,
        bank: p.bankName,
        reference: p.reference,
        amount: p.amountUsd,
        currency: 'USD',
        timestamp: p.createdAt.toISOString(),
        status: p.status,
      };
    }
  } catch (err) {
    console.error('[DB] Error querying bank payment from db:', err);
  }
  return null;
}

/**
 * Marks bank payment claimed in PostgreSQL
 */
export async function markBankPaymentClaimedInDb(reference: string, jobId: string): Promise<void> {
  try {
    const cleanRef = reference.trim();
    await db
      .update(bankPayments)
      .set({
        status: 'claimed',
        claimedWalletId: `job_${jobId}`,
        claimedAt: new Date(),
      })
      .where(
        or(
          eq(bankPayments.reference, cleanRef),
          like(bankPayments.reference, `%${cleanRef}`)
        )
      );
  } catch (err) {
    console.error('[DB] Error marking bank payment claimed in db:', err);
  }
}
