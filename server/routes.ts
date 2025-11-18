import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import narrativeRoutes from "./modes/narrative/routes";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use('/api/narrative', narrativeRoutes);

  // Seed comprehensive demo data
  app.post('/api/seed-demo', async (req, res) => {
    try {
      const workspaceId = 'demo-workspace-1';
      
      // 1. Create sample characters
      const characterData = [
        {
          workspaceId,
          name: "Elena Martinez",
          description: "A determined journalist investigating a conspiracy",
          personality: "Brave, inquisitive, compassionate",
          appearance: {
            age: "32",
            height: "5'7\"",
            build: "Athletic",
            hair: "Dark brown, shoulder-length",
            eyes: "Deep brown",
            style: "Professional casual, leather jacket"
          },
          thumbnailUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        },
        {
          workspaceId,
          name: "Dr. James Chen",
          description: "A brilliant scientist with a dark secret",
          personality: "Intelligent, secretive, conflicted",
          appearance: {
            age: "45",
            height: "5'10\"",
            build: "Slim",
            hair: "Black with gray streaks",
            eyes: "Dark",
            style: "Lab coat, glasses"
          },
          thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        },
        {
          workspaceId,
          name: "Maya Thompson",
          description: "A tech-savvy hacker helping uncover the truth",
          personality: "Witty, loyal, rebellious",
          appearance: {
            age: "26",
            height: "5'5\"",
            build: "Petite",
            hair: "Purple streaks in black hair",
            eyes: "Green",
            style: "Streetwear, hoodies"
          },
          thumbnailUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
        }
      ];

      const characters = await Promise.all(
        characterData.map(char => storage.createCharacter(char as any))
      );

      // 2. Create sample voices
      const voiceData = [
        {
          workspaceId,
          name: "Professional Female",
          provider: "ElevenLabs",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
          settings: { stability: 0.75, similarity_boost: 0.85 },
          sampleUrl: null,
        },
        {
          workspaceId,
          name: "Confident Male",
          provider: "ElevenLabs",
          voiceId: "pNInz6obpgDQGcFmaJgB",
          settings: { stability: 0.80, similarity_boost: 0.75 },
          sampleUrl: null,
        },
        {
          workspaceId,
          name: "Young Energetic",
          provider: "ElevenLabs",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          settings: { stability: 0.70, similarity_boost: 0.80 },
          sampleUrl: null,
        }
      ];

      const voices = await Promise.all(
        voiceData.map(voice => storage.createVoice(voice as any))
      );

      // 3. Create sample videos (with fake workspace)
      const videoData = [
        {
          workspaceId,
          title: "The Midnight Conspiracy",
          mode: "narrative",
          narrativeMode: "start-end",
          status: "completed",
          script: "A journalist discovers a corporate conspiracy that threatens millions of lives. As she digs deeper, she realizes the truth is more terrifying than she imagined.",
          duration: 180,
          exportUrl: "https://example.com/videos/midnight-conspiracy.mp4",
          continuityLocked: true,
          voiceOverEnabled: true,
        },
        {
          workspaceId,
          title: "City Lights",
          mode: "narrative",
          narrativeMode: "image-reference",
          status: "completed",
          script: "A visual journey through the neon-lit streets of Tokyo at night. Experience the vibrant energy and quiet moments of urban life.",
          duration: 120,
          exportUrl: "https://example.com/videos/city-lights.mp4",
          continuityLocked: false,
          voiceOverEnabled: false,
        },
        {
          workspaceId,
          title: "Desert Wanderer",
          mode: "narrative",
          narrativeMode: "start-end",
          status: "rendering",
          script: "A lone traveler's journey across vast desert landscapes. A meditation on solitude, survival, and the beauty of nature.",
          duration: 150,
          exportUrl: null,
          continuityLocked: true,
          voiceOverEnabled: true,
        }
      ];

      const videos = await Promise.all(
        videoData.map(video => storage.createVideo(video as any))
      );

      // 4. Create sample location reference images
      const locationData = [
        {
          videoId: null,
          shotId: null,
          characterId: null,
          type: "location",
          imageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800",
          description: "Modern Corporate Office - Glass and steel skyscraper interior",
        },
        {
          videoId: null,
          shotId: null,
          characterId: null,
          type: "location",
          imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
          description: "Mountain Landscape - Snowy peaks at sunset",
        },
        {
          videoId: null,
          shotId: null,
          characterId: null,
          type: "location",
          imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800",
          description: "Cyberpunk City - Neon-lit streets with rain reflections",
        },
        {
          videoId: null,
          shotId: null,
          characterId: null,
          type: "location",
          imageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800",
          description: "Desert Oasis - Palm trees and clear water",
        },
        {
          videoId: null,
          shotId: null,
          characterId: null,
          type: "location",
          imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
          description: "Mountain Range - Epic alpine vista",
        }
      ];

      const locations = await Promise.all(
        locationData.map(loc => storage.createReferenceImage(loc as any))
      );

      res.json({
        success: true,
        message: 'Demo data seeded successfully',
        data: {
          characters: characters.length,
          voices: voices.length,
          videos: videos.length,
          locations: locations.length
        }
      });
    } catch (error) {
      console.error('Demo seeding error:', error);
      res.status(500).json({ error: 'Failed to seed demo data' });
    }
  });

  // Character routes
  app.get('/api/characters', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: 'workspaceId is required' });
      }
      const characters = await storage.getCharactersByWorkspaceId(workspaceId);
      res.json(characters);
    } catch (error) {
      console.error('Error fetching characters:', error);
      res.status(500).json({ error: 'Failed to fetch characters' });
    }
  });

  // Voice routes
  app.get('/api/voices', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: 'workspaceId is required' });
      }
      const voices = await storage.getVoicesByWorkspaceId(workspaceId);
      res.json(voices);
    } catch (error) {
      console.error('Error fetching voices:', error);
      res.status(500).json({ error: 'Failed to fetch voices' });
    }
  });

  // Video routes
  app.get('/api/videos', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: 'workspaceId is required' });
      }
      const videos = await storage.getVideosByWorkspaceId(workspaceId);
      res.json(videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  // Location reference images routes
  app.get('/api/locations', async (req, res) => {
    try {
      // Get all reference images of type "location"
      const allRefs = Array.from((storage as any).referenceImages.values());
      const locations = allRefs.filter((ref: any) => ref.type === 'location');
      res.json(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
