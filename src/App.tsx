import { useEffect, useMemo, useState } from "react";

/**
 * MVP "Affluences Urgences" — Paris/IDF (frontend seul)
 * ----------------------------------------------------
 * Démo d’orientation selon l’affluence et la spécialité.
 * ⚠️ Ce n’est pas un dispositif médical. En cas d’urgence vitale, 15 / 112.
 */

// --- Types ---

type SpecialtyKey =
  | "trauma_ortho" // traumatologie / orthopédie
  | "cardio"
  | "pediatrie"
  | "ophtalmo"
  | "dermato"
  | "gyneco"
  | "orl"
  | "neuro"
  | "gastro"
  | "pneumo"
  | "psychiatrie"
  | "infectieux"
  | "autre";

interface SpecialtyLoad {
  wait_min_estimate: number;
  level: "low" | "med" | "high" | "closed";
}

interface Hospital {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  isAdult: boolean;
  isPediatric: boolean;
  specialties: Partial<Record<SpecialtyKey, SpecialtyLoad>>;
}

// --- Données mockées (fallback si l'API ne répond pas) ---

const DEFAULT_HOSPITALS: Hospital[] = [
  {
    id: "pitie",
    name: "AP-HP Hôpital Pitié-Salpêtrière",
    address: "47-83 Bd de l'Hôpital, 75013 Paris",
    lat: 48.8385,
    lng: 2.3624,
    isAdult: true,
    isPediatric: false,
    specialties: {
      trauma_ortho: { wait_min_estimate: 110, level: "high" },
      cardio: { wait_min_estimate: 55, level: "med" },
      orl: { wait_min_estimate: 40, level: "low" },
      autre: { wait_min_estimate: 60, level: "med" },
    },
  },
  {
    id: "bichat",
    name: "AP-HP Hôpital Bichat - Claude-Bernard",
    address: "46 Rue Henri Huchard, 75018 Paris",
    lat: 48.8973,
    lng: 2.3295,
    isAdult: true,
    isPediatric: false,
    specialties: {
      trauma_ortho: { wait_min_estimate: 60, level: "med" },
      cardio: { wait_min_estimate: 35, level: "low" },
      neuro: { wait_min_estimate: 70, level: "med" },
      autre: { wait_min_estimate: 45, level: "low" },
    },
  },
  {
    id: "nef",
    name: "Hôpital Necker-Enfants Malades (pédiatrique)",
    address: "149 Rue de Sèvres, 75015 Paris",
    lat: 48.8466,
    lng: 2.3158,
    isAdult: false,
    isPediatric: true,
    specialties: {
      pediatrie: { wait_min_estimate: 45, level: "med" },
      trauma_ortho: { wait_min_estimate: 55, level: "med" },
      cardio: { wait_min_estimate: 30, level: "low" },
      autre: { wait_min_estimate: 40, level: "low" },
    },
  },
  {
    id: "saintantoine",
    name: "AP-HP Hôpital Saint-Antoine",
    address: "184 Rue du Faubourg Saint-Antoine, 75012 Paris",
    lat: 48.8498,
    lng: 2.3857,
    isAdult: true,
    isPediatric: false,
    specialties: {
      trauma_ortho: { wait_min_estimate: 35, level: "low" },
      orl: { wait_min_estimate: 25, level: "low" },
      autre: { wait_min_estimate: 40, level: "low" },
    },
  },
];

// --- Mapping symptôme -> spécialité ---

const SYMPTOM_TO_SPECIALTY: Record<string, SpecialtyKey> = {
  // Traumatologie / Orthopédie
  "genou cassé": "trauma_ortho",
  "fracture tibia": "trauma_ortho",
  "fracture péroné": "trauma_ortho",
  "fracture fémur": "trauma_ortho",
  "fracture cheville": "trauma_ortho",
  "fracture poignet": "trauma_ortho",
  "fracture radius": "trauma_ortho",
  "fracture cubitus": "trauma_ortho",
  "fracture humérus": "trauma_ortho",
  "fracture clavicule": "trauma_ortho",
  "fracture côte": "trauma_ortho",
  "fracture bassin": "trauma_ortho",
  "entorse cheville": "trauma_ortho",
  "entorse genou": "trauma_ortho",
  "luxation épaule": "trauma_ortho",
  "luxation doigt": "trauma_ortho",
  "plaie profonde": "trauma_ortho",
  "point de suture": "trauma_ortho",
  "plaie tête": "trauma_ortho",
  "traumatisme crânien": "trauma_ortho",
  "morsure animale": "trauma_ortho",
  "écrasement doigt": "trauma_ortho",
  "corps étranger plaie": "trauma_ortho",
  "douleur dos post chute": "trauma_ortho",

  // Cardiologie
  "douleur thoracique": "cardio",
  "oppression thoracique": "cardio",
  "palpitations": "cardio",
  "syncope": "cardio",
  "malaise à l'effort": "cardio",
  "dyspnée brutale": "cardio",
  "œdèmes jambes soudains": "cardio",
  "douleur bras gauche": "cardio",
  "tachycardie": "cardio",
  "bradycardie": "cardio",

  // Neurologie
  "suspicion avc": "neuro",
  "faiblesse brutale hémicorps": "neuro",
  "troubles parole": "neuro",
  "convulsions": "neuro",
  "céphalée brutale": "neuro",
  "perte de connaissance": "neuro",
  "vertiges sévères": "neuro",
  "troubles de la vue neurologiques": "neuro",
  "engourdissement soudain": "neuro",

  // Pédiatrie
  "enfant fièvre": "pediatrie",
  "nourrisson fièvre": "pediatrie",
  "bronchiolite": "pediatrie",
  "convulsions fébriles": "pediatrie",
  "déshydratation enfant": "pediatrie",
  "diarrhée sévère enfant": "pediatrie",
  "vomissements incoercibles enfant": "pediatrie",
  "trauma enfant": "pediatrie",
  "plaie enfant": "pediatrie",
  "toux quinteuse enfant": "pediatrie",

  // ORL
  "saignement nez": "orl",
  epistaxis: "orl",
  "angine sévère": "orl",
  "amygdalite aiguë": "orl",
  "otite aiguë": "orl",
  "otite douloureuse": "orl",
  "obstruction gorge": "orl",
  lombardite: "orl",
  "corps étranger nez": "orl",
  "corps étranger oreille": "orl",
  "amuïssement brutal": "orl",

  // Dermatologie
  "brûlure 1er degré": "dermato",
  "brûlure 2e degré": "dermato",
  "brûlure chimique": "dermato",
  "plaie infectée": "dermato",
  "abcès cutané": "dermato",
  "cellulite cutanée": "dermato",
  urticaire: "dermato",
  "allergie cutanée": "dermato",
  "dermite contact sévère": "dermato",

  // Gynéco-Obstétrique
  "douleur abdominale enceinte": "gyneco",
  "saignement grossesse": "gyneco",
  "grossesse extra-utérine suspecte": "gyneco",
  "perte des eaux": "gyneco",
  contractions: "gyneco",
  "fièvre post-partum": "gyneco",
  "douleurs pelviennes aiguës": "gyneco",
  "rétention placentaire suspecte": "gyneco",

  // Ophtalmologie
  "mal à l'oeil": "ophtalmo",
  "douleur œil": "ophtalmo",
  "baisse brutale vision": "ophtalmo",
  "corps étranger oeil": "ophtalmo",
  "trauma œil": "ophtalmo",
  "œil rouge douloureux": "ophtalmo",
  "flashs lumineux": "ophtalmo",
  "décollement rétine suspect": "ophtalmo",

  // Gastro
  "douleurs abdominales intenses": "gastro",
  "hémorragie digestive": "gastro",
  "sang dans les selles": "gastro",
  "vomissements incoercibles": "gastro",
  "diarrhée sévère": "gastro",
  "ictère aigu": "gastro",
  "occlusion intestinale": "gastro",
  "appendicite suspecte": "gastro",
  "pancréatite suspecte": "gastro",

  // Pneumo
  "détresse respiratoire": "pneumo",
  "crise d'asthme": "pneumo",
  "asthme sévère": "pneumo",
  bronchospasme: "pneumo",
  "pneumonie suspecte": "pneumo",
  "embolie pulmonaire suspecte": "pneumo",
  "toux avec dyspnée": "pneumo",
  "BPCO décompensée": "pneumo",

  // Psychiatrie
  "idées suicidaires": "psychiatrie",
  "tentative de suicide": "psychiatrie",
  "agitation sévère": "psychiatrie",
  hallucinations: "psychiatrie",
  "attaque de panique sévère": "psychiatrie",
  "état maniaque": "psychiatrie",
  "sevrage sévère": "psychiatrie",

  // Infectieux
  "fièvre élevée": "infectieux",
  "sepsis suspect": "infectieux",
  "méningite suspecte": "infectieux",
  "infection urinaire sévère": "infectieux",
  pyélonéphrite: "infectieux",
  érysipèle: "infectieux",
  "covid sévère suspect": "infectieux",
  "grippe sévère": "infectieux",

  // Divers
  "lombalgie aiguë": "autre",
  "torticolis aigu": "autre",
  "anxiété aiguë": "autre",
  déshydratation: "autre",
  "coup de chaleur": "autre",
  hypothermie: "autre",
  "morsure tique": "autre",
  "piqûre guêpe": "autre",
  "réaction allergique": "dermato",
  "chute sans gravité": "trauma_ortho",
  "accident de trottinette": "trauma_ortho",
  "accident vélo": "trauma_ortho",
  "accident voie publique": "trauma_ortho",
  "intoxication alimentaire": "gastro",
  "brûlure soleil sévère": "dermato",
  engelures: "dermato",
  "saignement inexpliqué": "autre",
  hématurie: "infectieux",
  "rétention urinaire": "autre",
  "douleur testiculaire aiguë": "autre",
  "torsion testiculaire suspecte": "autre",
  "piqûre méduse": "dermato",
  "plaie morsure chien": "trauma_ortho",
  "plaie morsure chat": "trauma_ortho",
  "trauma rachis": "trauma_ortho",
  "douleur épigastrique aiguë": "gastro",
  hématémèse: "gastro",
  "malaise hypoglycémique": "autre",
  hyperglycémie: "autre",
  "prise toxiques": "psychiatrie",
  overdose: "psychiatrie",
  "brûlure inhalation": "pneumo",
  "exposition fumées": "pneumo",
  "noyade non fatale": "pneumo",
  gelures: "dermato",
  "plaie par verre": "trauma_ortho",
  "plaie scalp": "trauma_ortho",
  "saignement post-extraction dentaire": "orl",
  "douleur dentaire aiguë": "orl",
  "abcès dentaire": "orl",
  otorragie: "orl",
  "acouphènes aigus": "orl",
  "surdité brusque": "orl",
  "épiglottite suspecte": "orl",
  stridor: "orl",
  "érythème migrant": "infectieux",
  "zona ophtalmique": "ophtalmo",
  "conjonctivite sévère": "ophtalmo",
  "glaucome aigu": "ophtalmo",
  "douleur flanc droit": "gastro",
  "colique néphrétique": "gastro",
  "douleur hypogastre": "gastro",
  "hémorragie rectale": "gastro",
  "suspicion occlusion": "gastro",
  "douleur costale": "trauma_ortho",
  "plaie superficielle": "trauma_ortho",
  "saignement plaie": "trauma_ortho",
  "crise d'angoisse": "psychiatrie",
  "alcoolisation aiguë": "psychiatrie",
  "sevrage alcoolique": "psychiatrie",
  accouchement: "gyneco",
  "retard de règles douloureux": "gyneco",
  "douleurs menstruelles intenses": "gyneco",
  "saignement gynéco": "gyneco",
  "torsion d'ovaire suspecte": "gyneco",

  autre: "autre",
};

const ALL_SYMPTOMS = Object.keys(SYMPTOM_TO_SPECIALTY).sort((a, b) =>
  a.localeCompare(b)
);

// --- Utilitaires ---

function toRad(v: number) {
  return (v * Math.PI) / 180;
}
function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function estimateTravelMinutes(distanceKm: number) {
  return Math.round((distanceKm / 25) * 60); // ~25 km/h en urbain
}

// --- Modèle d’estimation ---

interface Recommendation {
  hospital: Hospital;
  total_minutes: number;
  reason: string[];
  wait_minutes: number;
  travel_minutes?: number;
  level?: SpecialtyLoad["level"];
}

function rankHospitals(
  hospitals: Hospital[],
  user: { lat?: number; lng?: number; isChild: boolean },
  symptomKey: string
): Recommendation[] {
  const targetSpec: SpecialtyKey = SYMPTOM_TO_SPECIALTY[symptomKey] ?? "autre";

  const recs: Recommendation[] = hospitals
    .filter((h) => (user.isChild ? h.isPediatric : h.isAdult))
    .map((h) => {
      const load = h.specialties[targetSpec] || h.specialties["autre"];
      if (!load || load.level === "closed") {
        return {
          hospital: h,
          total_minutes: Number.POSITIVE_INFINITY,
          reason: ["Spécialité indisponible ou fermée"],
          wait_minutes: Number.POSITIVE_INFINITY,
          level: "closed",
        } as Recommendation;
      }

      let travel: number | undefined = undefined;
      if (user.lat != null && user.lng != null) {
        const km = haversineKm(
          { lat: user.lat, lng: user.lng },
          { lat: h.lat, lng: h.lng }
        );
        travel = estimateTravelMinutes(km);
      }

      const weightWait = 0.75;
      const weightTravel = 0.25;

      const total = Math.round(
        travel != null
          ? weightWait * load.wait_min_estimate + weightTravel * travel
          : load.wait_min_estimate
      );

      const reason: string[] = [
        `Attente estimée ${load.wait_min_estimate} min (état: ${load.level})`,
      ];
      if (travel != null) reason.push(`Trajet estimé ~${travel} min`);
      reason.push(`Motif orienté vers la spécialité: ${targetSpec}`);

      return {
        hospital: h,
        total_minutes: total,
        reason,
        wait_minutes: load.wait_min_estimate,
        travel_minutes: travel,
        level: load.level,
      } as Recommendation;
    })
    .filter((r) => Number.isFinite(r.total_minutes))
    .sort((a, b) => a.total_minutes - b.total_minutes);

  return recs;
}

// --- Dev tests rapides (ne bloquent pas l'UI) ---

function runDevTests() {
  try {
    console.group("DEV tests");
    console.assert(
      SYMPTOM_TO_SPECIALTY["genou cassé"] === "trauma_ortho",
      "Mapping genou cassé → trauma_ortho"
    );
    console.assert(ALL_SYMPTOMS.length >= 80, "Attendu ≥ 80 motifs en liste");
    const recs = rankHospitals(
      DEFAULT_HOSPITALS,
      { isChild: false },
      "douleur thoracique"
    );
    console.assert(
      Array.isArray(recs) && recs.length > 0,
      "Ranking renvoie des résultats"
    );
    for (let i = 1; i < Math.min(3, recs.length); i++) {
      console.assert(
        recs[i - 1].total_minutes <= recs[i].total_minutes,
        "Tri croissant par total_minutes"
      );
    }
    console.groupEnd();
  } catch (e) {
    console.warn("DEV tests failed:", e);
  }
}

// --- UI — Panneau Clinicien ---

function ClinicianPanel({ hospitals }: { hospitals: Hospital[] }) {
  const [hospitalId, setHospitalId] = useState<string>(hospitals[0]?.id || "");
  const [symptom, setSymptom] = useState<string>(ALL_SYMPTOMS[0]);
  const [specialtyOverride, setSpecialtyOverride] = useState<string>("");
  const [estWait, setEstWait] = useState<number>(30);
  const [deltaQueue, setDeltaQueue] = useState<number>(1);
  const [note, setNote] = useState<string>("");

  const hospital = useMemo(
    () => hospitals.find((h) => h.id === hospitalId),
    [hospitalId, hospitals]
  );
  const inferredSpec = useMemo(
    () => SYMPTOM_TO_SPECIALTY[symptom] || "autre",
    [symptom]
  );
  const spec: SpecialtyKey = (specialtyOverride as SpecialtyKey) || inferredSpec;

  async function sendUpdate() {
    const payload = {
      ts: new Date().toISOString(),
      hospitalId: hospitalId,
      specialty: spec,
      symptom,
      est_wait_min: estWait,
      delta_queue: deltaQueue,
      note: note || undefined,
      source: "clinician-panel-mvp",
    };
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert(`Mise à jour envoyée.\n${JSON.stringify(payload, null, 2)}`);
    } catch (e) {
      console.log("[DEV] Payload prêt à l'envoi:", payload);
      alert(
        `(Mode démo) Aucune API configurée.\nPayload:\n${JSON.stringify(
          payload,
          null,
          2
        )}`
      );
    }
  }

  return (
    <section className="bg-white rounded-2xl shadow p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-4">
        Interface médecin / infirmier — Mise à jour d'affluence
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Établissement</label>
          <select
            className="w-full border rounded-xl p-2"
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Adresse : {hospital?.address || ""}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Motif (rapide)</label>
          <select
            className="w-full border rounded-xl p-2"
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
          >
            {ALL_SYMPTOMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Spécialité déduite :{" "}
            <span className="font-medium">
              {SYMPTOM_TO_SPECIALTY[symptom] || "autre"}
            </span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Spécialité (option : forcer)
          </label>
          <select
            className="w-full border rounded-xl p-2"
            value={specialtyOverride}
            onChange={(e) => setSpecialtyOverride(e.target.value)}
          >
            <option value="">
              Auto ({SYMPTOM_TO_SPECIALTY[symptom] || "autre"})
            </option>
            {Object.keys(hospitals[0]?.specialties || { autre: {} }).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Temps d'attente estimé (min)
          </label>
          <input
            className="w-full border rounded-xl p-2"
            type="number"
            min={0}
            value={estWait}
            onChange={(e) =>
              setEstWait(parseInt(e.target.value || "0", 10) || 0)
            }
          />
          <p className="text-xs text-gray-500 mt-2">
            Ce champ écrase/ajuste l'estimation pour la spécialité.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Flux file d'attente
          </label>
          <div className="flex items-center gap-2">
            <button
              className="border rounded-xl px-3 py-2"
              onClick={() => setDeltaQueue(-1)}
            >
              −1 patient (sortie)
            </button>
            <input
              className="w-24 border rounded-xl p-2 text-center"
              type="number"
              value={deltaQueue}
              onChange={(e) =>
                setDeltaQueue(parseInt(e.target.value || "0", 10) || 0)
              }
            />
            <button
              className="border rounded-xl px-3 py-2"
              onClick={() => setDeltaQueue(1)}
            >
              +1 patient (nouveau)
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Utilisez −1 quand un patient quitte la file, +1 pour une nouvelle
            arrivée.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Note (optionnel)</label>
          <input
            className="w-full border rounded-xl p-2"
            placeholder="Ex: Fermeture imagerie jusqu'à 14h"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          className="border rounded-xl px-4 py-2 hover:bg-gray-50"
          onClick={sendUpdate}
        >
          Envoyer
        </button>
        <span className="text-xs text-gray-500">
          POST → <code>/api/events</code> (à implémenter côté serveur)
        </span>
      </div>
    </section>
  );
}

// --- App principale ---

export default function App() {
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"patient" | "medecin">("patient");
  const [symptom, setSymptom] = useState<string>(ALL_SYMPTOMS[0] || "autre");
  const [isChild, setIsChild] = useState(false);
  const [geo, setGeo] = useState<{ lat?: number; lng?: number }>({});

  // State alimenté par l’API (+ fallback)
  const [hospitals, setHospitals] =
    useState<Hospital[]>(DEFAULT_HOSPITALS);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Récupération depuis l’API /api/hospitals (Vercel)
  useEffect(() => {
    async function fetchHospitals() {
      try {
        setLoading(true);
        const res = await fetch("/api/hospitals");
        if (!res.ok) throw new Error("Erreur API: " + res.status);
        const data = await res.json();
        setHospitals(data);
      } catch (err: any) {
        console.error("Erreur de chargement des hôpitaux:", err);
        setApiError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHospitals();
  }, []);

  // Tests dev
  useEffect(() => {
    runDevTests();
  }, []);

  const recommendations = useMemo(
    () => rankHospitals(hospitals, { ...geo, isChild }, symptom),
    [isChild, symptom, geo, hospitals]
  );

  function askGeolocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setError("Impossible de récupérer la position: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Urgences – Orientation par affluence (MVP)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Prototype démonstrateur (Paris/IDF) — Ne remplace pas le 15 / 112 ni
            un avis médical.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              className={`border rounded-xl px-3 py-1 ${
                mode === "patient" ? "bg-gray-900 text-white" : "hover:bg-gray-50"
              }`}
              onClick={() => setMode("patient")}
            >
              Mode patient
            </button>
            <button
              className={`border rounded-xl px-3 py-1 ${
                mode === "medecin" ? "bg-gray-900 text-white" : "hover:bg-gray-50"
              }`}
              onClick={() => setMode("medecin")}
            >
              Mode médecin
            </button>
          </div>
        </header>

        {mode === "patient" && (
          <>
            <section className="bg-white rounded-2xl shadow p-4 md:p-6 mb-6">
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Symptôme / Motif
                  </label>
                  <select
                    value={symptom}
                    onChange={(e) => setSymptom(e.target.value)}
                    className="w-full border rounded-xl p-2"
                  >
                    {ALL_SYMPTOMS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Mapping interne → spécialité (ex: genou cassé →
                    trauma/orthopédie).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Patientèle
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="pat"
                        checked={!isChild}
                        onChange={() => setIsChild(false)}
                      />
                      <span>Adulte</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="pat"
                        checked={isChild}
                        onChange={() => setIsChild(true)}
                      />
                      <span>Enfant</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Filtre automatiquement les services adultes/pédiatriques.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Position (optionnel)
                  </label>
                  <button
                    onClick={askGeolocation}
                    className="w-full border rounded-xl p-2 hover:bg-gray-50"
                  >
                    Utiliser ma géolocalisation
                  </button>
                  {geo.lat && geo.lng ? (
                    <p className="text-xs text-gray-500 mt-2">
                      Pos: {geo.lat.toFixed(4)}, {geo.lng.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">Non activée</p>
                  )}
                  {error && (
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4">Recommandations</h2>

              {loading && (
                <p className="text-sm text-gray-500 mb-2">
                  Chargement des données…
                </p>
              )}
              {apiError && (
                <p className="text-sm text-red-600 mb-2">
                  API indisponible ({apiError}). Données par défaut affichées.
                </p>
              )}
              {recommendations.length === 0 && (
                <p>Aucun résultat pour ces critères.</p>
              )}

              <div className="space-y-4">
                {recommendations.slice(0, 3).map((r, idx) => (
                  <div key={r.hospital.id} className="border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm text-gray-500">#{idx + 1}</div>
                        <div className="font-semibold text-base">
                          {r.hospital.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {r.hospital.address}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {r.total_minutes} min
                        </div>
                        <div className="text-xs text-gray-500">
                          Temps total estimé
                        </div>
                      </div>
                    </div>
                    <ul className="list-disc ml-6 mt-2 text-sm text-gray-700">
                      {r.reason.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-6">
                * Estimation indicative basée sur données mockées (démo). En
                situation d'urgence vitale, appelez le 15 / 112.
              </p>
            </section>

            <section className="mt-8 text-sm text-gray-600">
              <details>
                <summary className="cursor-pointer font-medium">
                  Brancher une vraie source de données (API)
                </summary>
                <div className="mt-2 space-y-3">
                  <p>
                    Remplacez <code>DEFAULT_HOSPITALS</code> par un fetch vers
                    votre backend qui agrège les temps d'attente et le niveau de
                    tension par spécialité pour chaque hôpital.
                  </p>
                  <pre className="bg-gray-100 p-3 rounded-lg overflow-auto text-xs">{`// Exemple (pseudo-code)
async function fetchHospitals(): Promise<Hospital[]> {
  const res = await fetch('/api/hospitals');
  return res.json();
}

useEffect(() => {
  fetchHospitals().then(setHospitalsFromApi);
}, []);`}</pre>
                  <p>
                    Contrat JSON minimal par hôpital :{" "}
                    {
                      "{ id, name, lat, lng, isAdult, isPediatric, specialties: { trauma_ortho: { wait_min_estimate, level }, ... } }"
                    }
                  </p>
                </div>
              </details>
            </section>
          </>
        )}

        {mode === "medecin" && (
          <div className="space-y-6">
            <ClinicianPanel hospitals={hospitals} />
          </div>
        )}
      </div>
    </div>
  );
}
