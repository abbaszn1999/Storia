import { CharacterCard } from '../character-card';

export default function CharacterCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <CharacterCard
        id="1"
        name="Alex Morgan"
        description="A young entrepreneur with a passion for technology and innovation"
        hasVoice={true}
      />
    </div>
  );
}
