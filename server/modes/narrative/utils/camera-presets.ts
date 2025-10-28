export interface CameraPreset {
  id: string;
  name: string;
  description: string;
  promptAddition: string;
}

export const cameraMovementPresets: CameraPreset[] = [
  {
    id: 'static',
    name: 'Static',
    description: 'No camera movement, locked position',
    promptAddition: 'static camera, no movement, locked frame',
  },
  {
    id: 'push-in',
    name: 'Slow Push In',
    description: 'Slowly dolly/move forward toward subject',
    promptAddition: 'slow dolly forward, smooth push in toward subject',
  },
  {
    id: 'pull-out',
    name: 'Pull Out',
    description: 'Slowly dolly/move backward away from subject',
    promptAddition: 'slow dolly backward, smooth pull out revealing more of scene',
  },
  {
    id: 'pan-left',
    name: 'Pan Left',
    description: 'Horizontal camera rotation to the left',
    promptAddition: 'smooth pan left, horizontal camera rotation',
  },
  {
    id: 'pan-right',
    name: 'Pan Right',
    description: 'Horizontal camera rotation to the right',
    promptAddition: 'smooth pan right, horizontal camera rotation',
  },
  {
    id: 'zoom-in',
    name: 'Slow Zoom In',
    description: 'Optical zoom closer to subject',
    promptAddition: 'slow zoom in, gradual magnification of subject',
  },
  {
    id: 'zoom-out',
    name: 'Slow Zoom Out',
    description: 'Optical zoom away from subject',
    promptAddition: 'slow zoom out, widening field of view',
  },
];

export const shotTypePresets = [
  { id: 'wide', name: 'Wide Shot', description: 'Shows the full environment and subjects' },
  { id: 'medium', name: 'Medium Shot', description: 'Shows subject from waist up' },
  { id: 'close-up', name: 'Close Up', description: 'Shows subject face or detail' },
  { id: 'extreme-close-up', name: 'Extreme Close Up', description: 'Very tight on specific detail' },
  { id: 'over-shoulder', name: 'Over the Shoulder', description: 'Looking over character shoulder at another' },
  { id: 'pov', name: 'POV', description: 'Point of view from character perspective' },
  { id: 'establishing', name: 'Establishing Shot', description: 'Wide shot showing location context' },
];

export function getCameraMovementPrompt(movementId: string): string {
  const preset = cameraMovementPresets.find(p => p.id === movementId);
  return preset?.promptAddition || '';
}
