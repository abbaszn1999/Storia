import { HistoryItem } from '../history-item';

export default function HistoryItemExample() {
  return (
    <div className="p-8 max-w-sm space-y-2">
      <HistoryItem
        id="1"
        title="Summer Product Launch"
        type="video"
        status="completed"
        updatedAt={new Date(Date.now() - 1000 * 60 * 60 * 2)}
        url="/videos/narrative/1"
      />
      <HistoryItem
        id="2"
        title="Quick Product Demo"
        type="story"
        status="processing"
        updatedAt={new Date(Date.now() - 1000 * 60 * 60 * 24)}
        url="/stories/2"
      />
      <HistoryItem
        id="3"
        title="Brand Story 2024"
        type="video"
        status="draft"
        updatedAt={new Date(Date.now() - 1000 * 60 * 60 * 48)}
        url="/videos/narrative/3"
      />
    </div>
  );
}
