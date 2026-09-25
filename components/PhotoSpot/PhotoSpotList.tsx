import PhotoSpotCard from "@/components/PhotoSpot/PhotoSpotCard";

export type PhotoSpot = {
  id: string;
  title: string;
  description?: string | null;
  image: string | null;
  latitude: number;
  longitude: number;
  fandomId?: string | null;
  fandomName?: string | null;
  yourSpot?: boolean;
};

type PhotoSpotListProps = {
  photoSpots: PhotoSpot[];
};

export default function PhotoSpotList({
  photoSpots,
}: PhotoSpotListProps) {
  return (
    <section className="space-y-3 px-4">
      {photoSpots.map((photoSpot) => (
        <PhotoSpotCard
          key={photoSpot.id}
          photoSpot={photoSpot}
        />
      ))}
    </section>
  );
}