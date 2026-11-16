import { lookupVehicle } from "@/lib/vrm/lookup";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, code: "invalid_json" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const vrm =
    payload && typeof payload === "object" && "vrm" in payload ? (payload as { vrm?: unknown }).vrm : undefined;
  if (typeof vrm !== "string") {
    return Response.json({ ok: false, code: "vrm_required" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const result = await lookupVehicle(vrm);
  return Response.json(result.body, {
    status: result.httpStatus,
    headers: { "Cache-Control": "no-store" },
  });
}
