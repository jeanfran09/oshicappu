import EventCard from "@/components/Event/EventCard";

export type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  interested: number;
  going: number;
  image: string | null;
};

type EventListProps = {
  events: Event[];
};

export default function EventList({
  events,
}: EventListProps) {
  return (
    <section className="space-y-3 px-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
        />
      ))}
    </section>
  );
}