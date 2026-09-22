import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  let dbStatus = "ok";
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
  } catch (err: any) {
    dbStatus = "error: " + (err?.message || "connection failed");
  }

  return NextResponse.json({
    status: dbStatus === "ok" ? "healthy" : "degraded",
    service: "1service",
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
