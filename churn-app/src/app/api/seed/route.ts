import { seedCustomers } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  try {
    const result = await seedCustomers(force);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "seed failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({ ok: true, hint: "POST /api/seed to load the 7,043-customer dataset" });
}
