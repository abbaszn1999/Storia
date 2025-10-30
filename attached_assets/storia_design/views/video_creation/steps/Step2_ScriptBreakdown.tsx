import React from 'react';
import { DocumentMagnifyingGlassIcon, PlusIcon } from '../../../components/icons';

interface StepProps { 
    onNext: () => void; 
    onBack: () => void; 
}

const mockBreakdown = {
    synopsis: "A cautionary tale about a boy named Max who learns the importance of listening to his teacher after getting injured on a slide that was under repair.",
    scenes: [
        { 
            id: 's1', 
            title: "Scene 1: The Warning",
            shots: [
                { id: 'sh1', description: "WIDE SHOT of a sunny playground. A teacher gathers a class of young children." },
                { id: 'sh2', description: "CLOSE UP on the teacher's face, her expression is serious as she points towards a large slide." },
                { id: 'sh3', description: "MEDIUM SHOT of Max in the crowd, looking confident and dismissive." },
            ]
        },
        {
            id: 's2',
            title: "Scene 2: The Mistake",
            shots: [
                { id: 'sh4', description: "TRACKING SHOT following Max as he walks defiantly towards the forbidden slide." },
                { id: 'sh5', description: "LOW ANGLE SHOT of Max climbing the ladder, a determined look on his face." },
                { id: 'sh6', description: "POV SHOT from Max's perspective at the top of the slide, showing a loose patch on the surface." },
                { id: 'sh7', description: "DYNAMIC SHOT of Max tumbling down the slide, ending in an awkward landing." },
            ]
        },
        {
            id: 's3',
            title: "Scene 3: The Lesson",
             shots: [
                { id: 'sh8', description: "MEDIUM SHOT of Max on the ground, holding his leg in pain, his clothes stained with mud." },
                { id: 'sh9', description: "CLOSE UP on Max's face, showing regret and tears welling up in his eyes." },
                { id: 'sh10', description: "OVER-THE-SHOULDER SHOT of the teacher approaching Max with a first-aid kit, her expression is kind." },
                { id: 'sh11', description: "CLOSE UP on the teacher's hands gently bandaging Max's leg." },
                { id: 'sh12', description: "FINAL SHOT of Max looking at his teacher, understanding and gratitude in his eyes." },
            ]
        }
    ]
};

export const Step2_ScriptBreakdown: React.FC<StepProps> = ({ onNext, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-8">
      <header className="text-center">
        <DocumentMagnifyingGlassIcon className="w-16 h-16 mx-auto text-slate-500 mb-4" />
        <h1 className="text-4xl font-bold text-white tracking-tight">Script Breakdown</h1>
        <p className="mt-2 text-lg text-slate-400">The AI has analyzed your script and created a structural plan. Review and edit the scenes and shot descriptions before we generate any visuals.</p>
      </header>
      
      <div className="space-y-6">
        <div>
            <h3 className="font-semibold text-white mb-2 text-lg">Synopsis</h3>
            <p className="text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-sm">{mockBreakdown.synopsis}</p>
        </div>
        {mockBreakdown.scenes.map(scene => (
          <div key={scene.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
            <input type="text" defaultValue={scene.title} className="font-bold text-white bg-transparent text-xl mb-3 w-full focus:outline-none focus:bg-slate-800 rounded px-2 py-1" />
            <div className="space-y-2">
              {scene.shots.map((shot, index) => (
                <div key={shot.id} className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono text-sm pt-2">{(index + 1).toString().padStart(2, '0')}</span>
                  <textarea 
                    defaultValue={shot.description} 
                    rows={2} 
                    className="flex-grow bg-slate-800 border border-slate-700 rounded-md py-1.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              ))}
              <button className="flex items-center gap-2 text-sm text-blue-400 font-semibold hover:text-blue-300 ml-8 pt-2">
                <PlusIcon className="w-4 h-4" /> Add Shot
              </button>
            </div>
          </div>
        ))}
         <button className="w-full flex items-center justify-center gap-2 text-md font-semibold text-slate-400 hover:text-white bg-slate-800/50 border-2 border-dashed border-slate-700/50 hover:border-slate-600 rounded-lg py-4 transition-colors">
            <PlusIcon className="w-5 h-5" /> Add Scene
        </button>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Next</button>
      </div>
    </div>
  );
};