import { supabaseClient } from "./_supabase";

export const config = { runtime: "edge" };

export default async function handler() {
  try {
    const supabase = supabaseClient();
    const { data, error } = await supabase
      .from("hospitals")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // Normalise les clés pour ton front
    const payload = (data || []).map((h) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      lat: h.lat,
      lng: h.lng,
      isAdult: h.is_adult,
      isPediatric: h.is_pediatric,
      specialties: h.specialties || {},
      updatedAt: h.updated_at,
    }));

    return new Response(JSON.stringify(payload), {
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
