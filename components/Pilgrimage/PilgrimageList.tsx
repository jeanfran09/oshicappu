import PilgrimageCard from "@/components/Pilgrimage/PilgrimageCard";

export type Pilgrimage = {
  id: string;
  title: string;
  description?: string | null;
  image: string | null;
  latitude: number;
  longitude: number;
  fandomId?: string | null;
  fandomName?: string | null;
  yourPilgrimage?: boolean;
};

type PilgrimageListProps = {
  pilgrimages: Pilgrimage[];
};

export default function PilgrimageList({
  pilgrimages,
}: PilgrimageListProps) {
  return (
    <section className="space-y-3 px-4">
      {pilgrimages.map((pilgrimage) => (
        <PilgrimageCard
          key={pilgrimage.id}
          pilgrimage={pilgrimage}
        />
      ))}
    </section>
  );
}