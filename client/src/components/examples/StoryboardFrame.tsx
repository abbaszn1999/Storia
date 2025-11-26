import { StoryboardFrame } from '../storyboard-frame';

export default function StoryboardFrameExample() {
  return (
    <div className="p-8 max-w-xs">
      <StoryboardFrame
        sceneNumber={1}
        shotNumber={3}
        description="Wide shot of the city skyline at sunset, golden light reflecting off glass buildings"
        onEdit={() => console.log('Edit frame')}
        onDelete={() => console.log('Delete frame')}
      />
    </div>
  );
}
