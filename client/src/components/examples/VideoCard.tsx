import { VideoCard } from '../video-card';

export default function VideoCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <VideoCard
        id="1"
        title="Summer Product Launch"
        mode="Narrative Video Mode"
        status="completed"
        duration={45}
        updatedAt={new Date(Date.now() - 1000 * 60 * 60 * 2)}
      />
    </div>
  );
}
