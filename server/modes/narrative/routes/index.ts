import { Router } from 'express';
import type { Request, Response } from 'express';
import { NarrativeAgents } from '../agents';
import { getCameraMovementPrompt } from '../utils/camera-presets';
import { StorageCleanup } from '../utils/storage-cleanup';
import { storage } from '../../../storage';
import { insertSceneSchema, insertShotSchema, insertContinuityGroupSchema, type Shot, type ShotVersion } from '@shared/schema';

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

router.post('/breakdown', async (req: Request, res: Response) => {
  try {
    const { videoId, script, model } = req.body;
    
    // Generate scene breakdown using Agent 3.1 & 3.2
    const sceneData = await NarrativeAgents.analyzeScript(script);
    
    // Transform to match expected frontend format with shots grouped by scene
    const scenes = sceneData.map((scene: any) => ({
      id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      videoId,
      title: scene.title,
      description: scene.description,
      location: scene.location || 'Unknown',
      timeOfDay: scene.timeOfDay || 'day',
      duration: scene.duration || 10,
      lighting: scene.lighting || 'natural',
      weather: scene.weather || 'clear',
      sortOrder: scene.sortOrder || 0,
      createdAt: new Date(),
    }));
    
    // Group shots by scene
    const shots: { [sceneId: string]: Shot[] } = {};
    sceneData.forEach((scene: any, sceneIndex: number) => {
      const sceneId = scenes[sceneIndex].id;
      shots[sceneId] = (scene.shots || []).map((shot: any, shotIndex: number) => ({
        id: `shot-${Date.now()}-${sceneIndex}-${shotIndex}`,
        sceneId,
        shotType: shot.shotType || 'medium',
        description: shot.description,
        cameraMovement: shot.cameraMovement || 'static',
        duration: shot.duration || 3,
        sortOrder: shotIndex,
        currentVersionId: null,
        createdAt: new Date(),
      }));
    });

    res.json({ scenes, shots });
  } catch (error) {
    console.error('Breakdown generation error:', error);
    res.status(500).json({ error: 'Failed to generate breakdown' });
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
    const partialSchema = insertSceneSchema.partial();
    const parsed = partialSchema.parse(req.body);
    const scene = await storage.updateScene(id, parsed);
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
    const partialSchema = insertShotSchema.partial();
    const parsed = partialSchema.parse(req.body);
    const shot = await storage.updateShot(id, parsed);
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

router.get('/continuity-groups/scene/:sceneId', async (req: Request, res: Response) => {
  try {
    const { sceneId } = req.params;
    const groups = await storage.getContinuityGroupsBySceneId(sceneId);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching continuity groups:', error);
    res.status(500).json({ error: 'Failed to fetch continuity groups' });
  }
});

router.post('/continuity-groups', async (req: Request, res: Response) => {
  try {
    const parsed = insertContinuityGroupSchema.parse(req.body);
    const group = await storage.createContinuityGroup(parsed);
    res.json(group);
  } catch (error: any) {
    console.error('Continuity group creation error:', error);
    res.status(400).json({ error: error.message || 'Failed to create continuity group' });
  }
});

router.put('/continuity-groups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await storage.getContinuityGroupById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Continuity group not found' });
    }
    
    const partialSchema = insertContinuityGroupSchema.partial();
    const parsed = partialSchema.parse(req.body);
    
    const updates: Partial<typeof existing> = {};
    if (parsed.sceneId !== undefined) updates.sceneId = parsed.sceneId;
    if (parsed.groupNumber !== undefined) updates.groupNumber = parsed.groupNumber;
    if (parsed.shotIds !== undefined) updates.shotIds = parsed.shotIds;
    if (parsed.description !== undefined) updates.description = parsed.description;
    if (parsed.transitionType !== undefined) updates.transitionType = parsed.transitionType;
    
    const group = await storage.updateContinuityGroup(id, updates);
    res.json(group);
  } catch (error: any) {
    console.error('Continuity group update error:', error);
    res.status(400).json({ error: error.message || 'Failed to update continuity group' });
  }
});

router.delete('/continuity-groups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await storage.deleteContinuityGroup(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Continuity group deletion error:', error);
    res.status(500).json({ error: 'Failed to delete continuity group' });
  }
});

router.post('/videos/:videoId/lock-continuity', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const video = await storage.getVideo(videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    if (video.continuityLocked) {
      return res.status(400).json({ error: 'Continuity is already locked for this video' });
    }
    
    if (video.narrativeMode !== 'start-end') {
      return res.status(400).json({ error: 'Continuity lock only applies to start-end narrative mode' });
    }
    
    await storage.updateVideo(videoId, { continuityLocked: true });
    res.json({ success: true, continuityLocked: true });
  } catch (error) {
    console.error('Error locking continuity:', error);
    res.status(500).json({ error: 'Failed to lock continuity' });
  }
});

router.post('/videos/:videoId/seed-demo', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    
    const existingScenes = await storage.getScenesByVideoId(videoId);
    if (existingScenes.length > 0) {
      // Fetch all related data for existing scenes
      const allShots: Shot[] = [];
      const allShotVersions: ShotVersion[] = [];
      const allContinuityGroups: any[] = [];
      
      for (const scene of existingScenes) {
        const sceneShots = await storage.getShotsBySceneId(scene.id);
        allShots.push(...sceneShots);
        
        const sceneContinuityGroups = await storage.getContinuityGroupsBySceneId(scene.id);
        allContinuityGroups.push(...sceneContinuityGroups);
        
        for (const shot of sceneShots) {
          const shotVersionsList = await storage.getShotVersionsByShotId(shot.id);
          allShotVersions.push(...shotVersionsList);
        }
      }
      
      return res.json({ 
        message: 'Demo data already exists',
        scenes: existingScenes,
        shots: allShots,
        shotVersions: allShotVersions,
        continuityGroups: allContinuityGroups,
      });
    }

    const demoScenes = [
      {
        videoId,
        sceneNumber: 1,
        title: "Discovery in the Attic",
        location: "Sarah's grandmother's attic",
        duration: 45,
        lighting: "dusty afternoon light",
        weather: null,
        notes: "Sarah discovers the mysterious map among old belongings",
      },
      {
        videoId,
        sceneNumber: 2,
        title: "Preparing for Adventure",
        location: "Sarah's apartment",
        duration: 30,
        lighting: "warm evening",
        weather: null,
        notes: "Sarah packs her gear and studies the map",
      },
      {
        videoId,
        sceneNumber: 3,
        title: "Arrival in the Jungle",
        location: "Amazon rainforest edge",
        duration: 40,
        lighting: "humid tropical sunlight",
        weather: "humid, occasional mist",
        notes: "Sarah arrives at the jungle's edge, ready to begin her trek",
      },
      {
        videoId,
        sceneNumber: 4,
        title: "The Temple Emerges",
        location: "Deep jungle clearing",
        duration: 50,
        lighting: "filtered green light through canopy",
        weather: "misty",
        notes: "After pushing through vegetation, the ancient temple appears",
      },
    ];

    const scenes = [];
    const shots = [];
    const shotVersions = [];

    for (const sceneData of demoScenes) {
      const scene = await storage.createScene(sceneData);
      scenes.push(scene);

      const demoShots = [
        {
          sceneId: scene.id,
          shotNumber: 1,
          shotType: "wide",
          description: "Establishing shot of the location",
          duration: Math.floor(sceneData.duration / 3),
          cameraMovement: "static",
        },
        {
          sceneId: scene.id,
          shotNumber: 2,
          shotType: "medium",
          description: "Sarah interacting with the environment",
          duration: Math.floor(sceneData.duration / 3),
          cameraMovement: "slow-pan",
        },
        {
          sceneId: scene.id,
          shotNumber: 3,
          shotType: "close-up",
          description: "Detail shot showing Sarah's expression or key object",
          duration: sceneData.duration - 2 * Math.floor(sceneData.duration / 3),
          cameraMovement: "static",
        },
      ];

      for (const shotData of demoShots) {
        const shot = await storage.createShot(shotData);
        shots.push(shot);

        const version = await storage.createShotVersion({
          shotId: shot.id,
          versionNumber: 1,
          imageUrl: null,
          imagePrompt: null,
          startFrameUrl: null,
          endFrameUrl: null,
          videoUrl: null,
          status: 'draft',
        });
        shotVersions.push(version);

        await storage.updateShot(shot.id, { currentVersionId: version.id });
      }
    }

    res.json({ 
      scenes,
      shots,
      shotVersions,
      continuityGroups: [], // No continuity groups for fresh seed
      message: 'Demo data seeded successfully'
    });
  } catch (error) {
    console.error('Demo seeding error:', error);
    res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

export default router;
