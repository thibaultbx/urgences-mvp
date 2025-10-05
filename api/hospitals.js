// /api/hospitals.js — Edge-compatible (réponse Web standard)
export const config = { runtime: "edge" };

export default async function handler(req) {
  const hospitals = [
    {
      id: 1,
      name: "AP-HP Hôpital Saint-Antoine",
      address: "184 Rue du Faubourg Saint-Antoine, 75012 Paris",
      lat: 48.8496,
      lng: 2.3778,
      isAdult: true,
      isPediatric: false,
      specialties: {
        trauma: { wait_min_estimate: 40, level: "low" },
        dermato: { wait_min_estimate: 45, level: "medium" },
      },
    },
    {
      id: 2,
      name: "AP-HP Hôpital Bichat – Claude-Bernard",
      address: "46 Rue Henri Huchard, 75018 Paris",
      lat: 48.8998,
      lng: 2.3272,
      isAdult: true,
      isPediatric: false,
      specialties: {
        dermato: { wait_min_estimate: 55, level: "medium" },
        cardio: { wait_min_estimate: 70, level: "high" },
      },
    },
    {
      id: 3,
      name: "AP-HP Hôpital Pitié-Salpêtrière",
      address: "47-83 Bd de l'Hôpital, 75013 Paris",
      lat: 48.8355,
      lng: 2.361,
      isAdult: true,
      isPediatric: true,
      specialties: {
        trauma: { wait_min_estimate: 60, level: "medium" },
        cardio: { wait_min_estimate: 50, level: "medium" },
        pediatrie: { wait_min_estimate: 35, level: "low" },
      },
    },
  ];

  return new Response(JSON.stringify(hospitals), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

