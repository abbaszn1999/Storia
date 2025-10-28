import { Router } from 'express';
import type { Request, Response } from 'express';
import { NarrativeAgents } from '../agents';
import { getCameraMovementPrompt } from '../utils/camera-presets';
import { StorageCleanup } from '../utils/storage-cleanup';
import { storage } from '../../../storage';
import { insertSceneSchema, insertShotSchema } from '@shared/schema';

const router = Router();

router.post('/script/generate', async (req: Request, res: Response) => {
  try {
    const { duration, genre, language, aspectRatio, userPrompt } = req.body;
    
    const script = await NarrativeAgents.generateScript({
      duration,
      genre,
      language,
      aspectRatio,
      userPrompt,
    });

    res.json({ script });
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

router.post('/script/analyze', async (req: Request, res: Response) => {
  try {
    const { script } = req.body;
    
    const scenes = await NarrativeAgents.analyzeScript(script);

    res.json({ scenes });
  } catch (error) {
    console.error('Script analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze script' });
  }
});

router.post('/character/create', async (req: Request, res: Response) => {
  try {
    const { name, role, description, style } = req.body;
    
    const characterDescription = await NarrativeAgents.createCharacter({
      name,
      role,
      description,
      style,
    });

    const referenceImage = await NarrativeAgents.generateImage(characterDescription);

    res.json({ 
      description: characterDescription,
      referenceImage,
    });
  } catch (error) {
    console.error('Character creation error:', error);
    res.status(500).json({ error: 'Failed to create character' });
  }
});

router.post('/shot/generate-image', async (req: Request, res: Response) => {
  try {
    const {
      sceneDescription,
      shotType,
      characters,
      location,
      timeOfDay,
      visualStyle,
      cameraMovement,
      additionalNotes,
      referenceImages,
    } = req.body;

    const imagePrompt = await NarrativeAgents.generateImagePrompt({
      sceneDescription,
      shotType,
      characters,
      location,
      timeOfDay,
      visualStyle,
      cameraMovement,
      additionalNotes,
    });

    const imageUrl = await NarrativeAgents.generateImage(imagePrompt, referenceImages);

    res.json({ 
      imageUrl,
      prompt: imagePrompt,
    });
  } catch (error) {
    console.error('Shot image generation error:', error);
    res.status(500).json({ error: 'Failed to generate shot image' });
  }
});

router.post('/shot/generate-video', async (req: Request, res: Response) => {
  try {
    const {
      imageUrl,
      shotDescription,
      cameraMovement,
      action,
      duration,
      pacing,
    } = req.body;

    const videoPrompt = await NarrativeAgents.generateVideoPrompt({
      shotDescription,
      cameraMovement,
      action,
      duration,
      pacing,
    });

    const videoUrl = await NarrativeAgents.generateVideo(imageUrl, videoPrompt);

    res.json({ 
      videoUrl,
      prompt: videoPrompt,
    });
  } catch (error) {
    console.error('Shot video generation error:', error);
    res.status(500).json({ error: 'Failed to generate shot video' });
  }
});

router.post('/video/finalize', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.body;

    await StorageCleanup.cleanupVideoFiles({
      videoId,
      keepFinalVideo: true,
      keepCharacterSheets: true,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Video finalization error:', error);
    res.status(500).json({ error: 'Failed to finalize video' });
  }
});

router.post('/scenes', async (req: Request, res: Response) => {
  try {
    const parsed = insertSceneSchema.parse(req.body);
    const scene = await storage.createScene(parsed);
    res.json(scene);
  } catch (error) {
    console.error('Scene creation error:', error);
    res.status(500).json({ error: 'Failed to create scene' });
  }
});

router.put('/scenes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scene = await storage.updateScene(id, req.body);
    res.json(scene);
  } catch (error) {
    console.error('Scene update error:', error);
    res.status(500).json({ error: 'Failed to update scene' });
  }
});

router.delete('/scenes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await storage.deleteScene(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Scene deletion error:', error);
    res.status(500).json({ error: 'Failed to delete scene' });
  }
});

router.post('/shots', async (req: Request, res: Response) => {
  try {
    const parsed = insertShotSchema.parse(req.body);
    const shot = await storage.createShot(parsed);
    res.json(shot);
  } catch (error) {
    console.error('Shot creation error:', error);
    res.status(500).json({ error: 'Failed to create shot' });
  }
});

router.put('/shots/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shot = await storage.updateShot(id, req.body);
    res.json(shot);
  } catch (error) {
    console.error('Shot update error:', error);
    res.status(500).json({ error: 'Failed to update shot' });
  }
});

router.delete('/shots/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await storage.deleteShot(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Shot deletion error:', error);
    res.status(500).json({ error: 'Failed to delete shot' });
  }
});

export default router;
