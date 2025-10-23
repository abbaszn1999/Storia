import { ModeSelector } from '../mode-selector';

export default function ModeSelectorExample() {
  return (
    <div className="p-8">
      <ModeSelector onSelect={(id) => console.log('Selected mode:', id)} />
    </div>
  );
}
