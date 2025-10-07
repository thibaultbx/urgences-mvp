interface Hospital {
  id: string;
  name: string;
  address: string;
}

interface Recommendation {
  hospital: Hospital;
  total_minutes: number;
  reason: string[];
}

interface Props {
  rec: Recommendation;
  rank: number;
}

export default function HospitalCard({ rec, rank }: Props) {
  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">#{rank}</div>
          <div className="font-semibold text-base">{rec.hospital.name}</div>
          <div className="text-sm text-gray-600">{rec.hospital.address}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{rec.total_minutes} min</div>
          <div className="text-xs text-gray-500">Temps total estimé</div>
        </div>
      </div>
      <ul className="list-disc ml-6 mt-2 text-sm text-gray-700">
        {rec.reason.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
