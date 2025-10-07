type Mode = "patient" | "medecin";

interface HeaderProps {
  mode: Mode;
  onSwitch: (m: Mode) => void;
}

export default function Header({ mode, onSwitch }: HeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold">
        Urgences – Orientation par affluence (MVP)
      </h1>
      <p className="text-sm text-gray-600 mt-1">
        Prototype démonstrateur (Paris/IDF) — Ne remplace pas le 15 / 112 ni un avis médical.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          className={`border rounded-xl px-3 py-1 ${mode === "patient" ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
          onClick={() => onSwitch("patient")}
        >
          Mode patient
        </button>
        <button
          className={`border rounded-xl px-3 py-1 ${mode === "medecin" ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
          onClick={() => onSwitch("medecin")}
        >
          Mode médecin
        </button>
      </div>
    </header>
  );
}
