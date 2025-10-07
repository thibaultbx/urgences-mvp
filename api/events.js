import { supabaseClient } from "./_supabase";

export const config = { runtime: "edge" };

function isValidBody(b) {
  return (
    b &&
    typeof b.hospitalId === "string" &&
    typeof b.specialty === "string" &&
    Number.isFinite(Number(b.est_wait_min))
  );
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
  try {
    const body = await req.json();
    if (!isValidBody(body)) {
      return new Response(JSON.stringify({ error: "Bad payload" }), {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const supabase = supabaseClient();
    const { error } = await supabase.from("events").insert({
      hospital_id: body.hospitalId,
      specialty: body.specialty,
      est_wait_min: Number(body.est_wait_min),
      delta_queue: Number(body.delta_queue || 0),
      note: body.note || null,
      user_id: body.userId || null,
      source: body.source || "clinician-panel-mvp",
    });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}
