import { sql } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";

export const dynamic = "force-dynamic";

const PERSONAS = ["recruiter", "hr", "customer", "engineer"];

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 160);
  const company = String(body.company ?? "").trim().slice(0, 160) || null;
  const persona = PERSONAS.includes(String(body.persona)) ? String(body.persona) : "recruiter";
  const message = String(body.message ?? "").trim().slice(0, 2000);

  if (name.length < 2) return Response.json({ ok: false, error: "Name is required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return Response.json({ ok: false, error: "A valid email is required" }, { status: 400 });
  if (message.length < 5)
    return Response.json({ ok: false, error: "Tell me a little more (5+ chars)" }, { status: 400 });

  try {
    const [row] = await db
      .insert(leads)
      .values({ name, email, company, persona, message })
      .returning({ id: leads.id, createdAt: leads.createdAt });
    return Response.json({ ok: true, id: row.id, createdAt: row.createdAt });
  } catch {
    return Response.json({ ok: false, error: "Could not save message right now" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const res = await db.execute<{ count: string; persona: string }>(
      sql`select persona, count(*)::text as count from leads group by persona`,
    );
    const total = res.rows.reduce((s, r) => s + Number(r.count), 0);
    return Response.json({ total, byPersona: res.rows });
  } catch {
    return Response.json({ total: 0, byPersona: [] });
  }
}
