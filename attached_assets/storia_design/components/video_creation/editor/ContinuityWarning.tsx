import React from 'react';
import { MythBustingIcon } from '../../icons';

export const ContinuityWarning: React.FC = () => {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3 text-sm">
      <MythBustingIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-yellow-300">Continuity Alert</h4>
        <p className="text-yellow-400/80">Character's outfit changed from previous shot. Use a character asset for consistency.</p>
      </div>
    </div>
  );
};
