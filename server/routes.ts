import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import narrativeRoutes from "./modes/narrative/routes";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use('/api/narrative', narrativeRoutes);

  // Workspace routes
  app.get('/api/workspaces', async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const workspaces = await storage.getWorkspacesByUserId(userId);
      res.json(workspaces);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
  });

  app.patch('/api/workspaces/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'name is required' });
      }

      const updated = await storage.updateWorkspace(id, { name, description });
      res.json(updated);
    } catch (error) {
      console.error('Error updating workspace:', error);
      res.status(500).json({ error: 'Failed to update workspace' });
    }
  });

  // Workspace integration routes
  app.get('/api/workspaces/:workspaceId/integrations', async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const integrations = await storage.getWorkspaceIntegrations(workspaceId);
      res.json(integrations);
    } catch (error) {
      console.error('Error fetching workspace integrations:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  });

  app.post('/api/workspaces/:workspaceId/integrations', async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const integrationData = req.body;

      if (!integrationData.platform) {
        return res.status(400).json({ error: 'platform is required' });
      }

      const integration = await storage.createWorkspaceIntegration({
        ...integrationData,
        workspaceId,
      });
      res.json(integration);
    } catch (error) {
      console.error('Error creating workspace integration:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create integration' });
    }
  });

  app.delete('/api/workspaces/:workspaceId/integrations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWorkspaceIntegration(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting workspace integration:', error);
      res.status(500).json({ error: 'Failed to delete integration' });
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

  const httpServer = createServer(app);

  return httpServer;
}
