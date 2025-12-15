# Audio Step Implementation - ElevenLabs TTS

## Overview
The Audio Step allows users to select a voice for voiceover narration and background music for their video. The voiceover is automatically generated when the user proceeds to the Export step.

## Features

### 1. Voice Selection (Conditional)
- **Only visible if `voiceoverEnabled = true`** (set in Concept Step)
- Supports **Arabic** and **English** voices
- Voice preview functionality
- Real-time voice switching

### 2. Voice Library
**Arabic Voices:**
- Lily (Female, Young) - `pFZP5JQG7iQjIQuC4Bku`
- Daniel (Male, Middle-aged) - `onwK4e9ZLuTAKqWW03F9`
- Matilda (Female, Mature) - `XrExE9yKIg1WjnnlVkGX`

**English Voices:**
- Rachel (Female, Young) - `21m00Tcm4TlvDq8ikWAM`
- Domi (Female, Young) - `AZnzlk1XvdvUeBnXmlld`
- Bella (Female, Middle-aged) - `EXAVITQu4vr4xnSDxMaL`
- Antoni (Male, Young) - `ErXwobaYiN019PkySvjV`
- Thomas (Male, Mature) - `GBv7mTt0atIp3Br8iCZE`
- Charlie (Male, Middle-aged) - `IKne3meq5aSn9XLyUdCD`

### 3. Background Music
- 5 music tracks available
- Volume controls for voice and music
- Music selection independent of voiceover

### 4. Auto-Generation
- **No "Generate Voiceover" button**
- Voiceover is generated automatically when user clicks "Continue to Export"
- Loading state shown during generation
- Generated audio URLs are saved to `scene.audioUrl`

## Technical Architecture

### Backend

#### 1. ElevenLabs Provider (`server/ai/providers/elevenlabs.ts`)
- Added TTS support to existing ElevenLabs provider
- Endpoint: `POST /v1/text-to-speech/{voice_id}`
- Returns: Audio buffer (MP3)
- Cost calculation: ~$0.30 per 1000 characters

#### 2. Voiceover Generator Agent (`server/stories/problem-solution/agents/voiceover-generator.ts`)
```typescript
export async function generateVoiceover(
  input: VoiceoverGeneratorInput,
  userId: string,
  workspaceName: string
): Promise<VoiceoverGeneratorOutput>
```

**Input:**
- `storyId`: Story identifier
- `scenes`: Array of scenes with narration and voiceInstructions
- `voiceId`: ElevenLabs voice ID
- `projectName`: Project name for storage path
- `workspaceId`: Workspace identifier

**Output:**
- `scenes`: Array with audioUrl for each scene
- `totalCost`: Total generation cost
- `errors`: Array of error messages

**Storage Path:**
```
{userId}/{workspaceName}/Story_Mode/problem-solution/{projectName}/Audio/scene_{N}.mp3
```

#### 3. API Route (`server/stories/problem-solution/routes/index.ts`)
```typescript
POST /api/problem-solution/voiceover
```

**Request Body:**
```json
{
  "storyId": "story-123",
  "scenes": [
    {
      "id": "scene-1",
      "sceneNumber": 1,
      "narration": "Once upon a time...",
      "voiceInstructions": "Speak slowly and warmly",
      "duration": 5
    }
  ],
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "projectName": "My Story",
  "workspaceId": "workspace-123"
}
```

**Response:**
```json
{
  "scenes": [
    {
      "sceneNumber": 1,
      "audioUrl": "https://cdn.bunny.net/.../scene_1.mp3",
      "duration": 5,
      "status": "generated"
    }
  ],
  "totalCost": 0.15,
  "errors": []
}
```

### Frontend

#### 1. Constants (`client/src/constants/elevenlabs-voices.ts`)
- Hardcoded list of ElevenLabs voices
- Helper functions: `getVoicesByLanguage()`, `getVoiceById()`

#### 2. AudioStep Component (`client/src/components/story-studio/steps/AudioStep.tsx`)
**Features:**
- Language tabs (Arabic/English)
- Voice preview with play/pause
- Voice selection with visual feedback
- Background music selection
- Volume controls (voice + music)
- Voiceover summary (word count, estimated duration)
- Info message about auto-generation

**Conditional Rendering:**
```typescript
{voiceoverEnabled && (
  <GlassPanel>
    {/* Voice Selection UI */}
  </GlassPanel>
)}
```

#### 3. ExportStep Component (`client/src/components/story-studio/steps/ExportStep.tsx`)
**Auto-Generation Logic:**
```typescript
useEffect(() => {
  if (voiceoverEnabled && !voiceoverGenerated && scenes.length > 0) {
    onGenerateVoiceover().then(() => {
      setVoiceoverGenerated(true);
    });
  }
}, [voiceoverEnabled, voiceoverGenerated, scenes.length, onGenerateVoiceover]);
```

#### 4. useStoryStudio Hook (`client/src/components/story-studio/hooks/useStoryStudio.ts`)
**generateVoiceover Function:**
```typescript
const generateVoiceover = useCallback(async () => {
  if (!state.voiceoverEnabled) return;
  if (!state.selectedVoice) return;
  
  // Call API
  const res = await apiRequest("POST", "/api/problem-solution/voiceover", {
    storyId, scenes, voiceId, projectName, workspaceId
  });
  
  // Update scenes with audioUrls
  setState(prev => ({
    ...prev,
    scenes: prev.scenes.map(scene => ({
      ...scene,
      audioUrl: data.scenes.find(s => s.sceneNumber === scene.sceneNumber)?.audioUrl
    }))
  }));
}, [state.voiceoverEnabled, state.selectedVoice, state.scenes]);
```

## Environment Variables

Add to `.env`:
```bash
ELEVENLABS_API_KEY=your_api_key_here
```

## Cost Estimation

**ElevenLabs TTS Pricing:**
- ~$0.30 per 1000 characters
- Average narration: 100-200 words per scene
- Average cost per scene: $0.05 - $0.15
- Total cost for 5 scenes: $0.25 - $0.75

## User Flow

1. **Concept Step**: User enables/disables voiceover
2. **Script Step**: User writes/edits narration for each scene
3. **Storyboard Step**: Agent 3 generates `voiceInstructions` (if voiceover enabled)
4. **Audio Step**: 
   - User selects voice (if voiceover enabled)
   - User selects background music
   - User adjusts volumes
5. **Export Step**:
   - System auto-generates voiceover (if enabled)
   - User exports final video with audio

## Testing

### Manual Testing Steps:
1. Create new story with voiceover enabled
2. Complete Concept, Script, and Storyboard steps
3. Navigate to Audio Step
4. Verify Voice Selection is visible
5. Select a voice and preview it
6. Select background music
7. Click "Continue to Export"
8. Verify voiceover generation starts automatically
9. Check that `scene.audioUrl` is populated

### API Testing:
```bash
curl -X POST http://localhost:5000/api/problem-solution/voiceover \
  -H "Content-Type: application/json" \
  -d '{
    "storyId": "test-story",
    "scenes": [{
      "id": "scene-1",
      "sceneNumber": 1,
      "narration": "This is a test narration",
      "duration": 5
    }],
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "projectName": "Test",
    "workspaceId": "test-workspace"
  }'
```

## Future Enhancements

1. **Voice Cloning**: Allow users to upload their own voice samples
2. **Voice Mixing**: Blend multiple voices for different characters
3. **Advanced Controls**: Pitch, speed, emphasis controls
4. **Background Music Upload**: Allow custom music uploads
5. **Audio Preview**: Play generated voiceover before export
6. **Batch Generation**: Generate voiceover for multiple stories at once
7. **Voice Caching**: Cache generated audio for reuse

## Troubleshooting

### Issue: Voice Selection not showing
**Solution**: Check that `voiceoverEnabled = true` in Concept Step

### Issue: Voiceover not generating
**Solution**: 
1. Check `ELEVENLABS_API_KEY` in `.env`
2. Verify API key is valid
3. Check console logs for errors

### Issue: Audio files not uploading
**Solution**: 
1. Check Bunny Storage credentials
2. Verify storage path is correct
3. Check file permissions

### Issue: Preview not playing
**Solution**:
1. Check browser console for CORS errors
2. Verify preview URLs are accessible
3. Check audio element permissions

