import { CalendarItem } from '../calendar-item';

export default function CalendarItemExample() {
  return (
    <div className="p-8 max-w-md">
      <CalendarItem
        title="Summer Product Launch"
        scheduledDate={new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)}
        platform="youtube"
        status="scheduled"
      />
    </div>
  );
}
