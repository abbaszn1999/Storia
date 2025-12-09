import { Router, type Request, Response } from "express";
import multer from "multer";
import { bunnyStorage } from "./bunny-storage";
import { isAuthenticated, getCurrentUserId } from "../auth";

const router = Router();

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
});

// =============================================================================
// BUNNY STORAGE API ROUTES
// =============================================================================

// Check if Bunny Storage is configured
router.get('/status', async (req, res) => {
  try {
    const config = bunnyStorage.getBunnyConfig();
    res.json({
      configured: config.isConfigured,
      cdnUrl: config.isConfigured ? config.cdnUrl : null,
    });
  } catch (error) {
    console.error('Error checking storage status:', error);
    res.status(500).json({ error: 'Failed to check storage status' });
  }
});

// Upload a file to Bunny Storage
router.post('/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
  try {
    if (!bunnyStorage.isBunnyConfigured()) {
      return res.status(503).json({ error: 'Bunny Storage is not configured' });
    }

    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { path: filePath } = req.body;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Sanitize the path to prevent directory traversal and scope to user
    const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
    const scopedPath = `${userId}/${sanitizedPath}`;

    const cdnUrl = await bunnyStorage.uploadFile(
      scopedPath,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({
      success: true,
      url: cdnUrl,
      path: scopedPath,
      size: req.file.size,
      contentType: req.file.mimetype,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// List files in a directory
router.get('/files', isAuthenticated, async (req: any, res) => {
  try {
    if (!bunnyStorage.isBunnyConfigured()) {
      return res.status(503).json({ error: 'Bunny Storage is not configured' });
    }

    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const folderPath = (req.query.path as string) || '';
    const sanitizedPath = folderPath.replace(/\.\./g, '').replace(/^\/+/, '');
    const scopedPath = sanitizedPath ? `${userId}/${sanitizedPath}` : `${userId}`;

    const files = await bunnyStorage.listFiles(scopedPath);
    
    // Transform to a cleaner response format
    const formattedFiles = files.map(file => ({
      name: file.ObjectName,
      path: file.Path + file.ObjectName,
      size: file.Length,
      isDirectory: file.IsDirectory,
      lastModified: file.LastChanged,
      contentType: file.ContentType,
      url: file.IsDirectory ? null : bunnyStorage.getPublicUrl(file.Path + file.ObjectName),
    }));

    res.json({
      path: scopedPath,
      files: formattedFiles,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get file info
router.get('/file-info', isAuthenticated, async (req: any, res) => {
  try {
    if (!bunnyStorage.isBunnyConfigured()) {
      return res.status(503).json({ error: 'Bunny Storage is not configured' });
    }

    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
    const scopedPath = `${userId}/${sanitizedPath}`;
    const info = await bunnyStorage.getFileInfo(scopedPath);

    if (!info) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      path: scopedPath,
      url: bunnyStorage.getPublicUrl(scopedPath),
      ...info,
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// Get CDN URL for a file
router.get('/url', isAuthenticated, async (req: any, res) => {
  try {
    if (!bunnyStorage.isBunnyConfigured()) {
      return res.status(503).json({ error: 'Bunny Storage is not configured' });
    }

    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
    const scopedPath = `${userId}/${sanitizedPath}`;
    const url = bunnyStorage.getPublicUrl(scopedPath);

    res.json({ url, path: scopedPath });
  } catch (error) {
    console.error('Error getting file URL:', error);
    res.status(500).json({ error: 'Failed to get file URL' });
  }
});

// Check if a file exists
router.get('/exists', isAuthenticated, async (req: any, res) => {
  try {
    if (!bunnyStorage.isBunnyConfigured()) {
      return res.status(503).json({ error: 'Bunny Storage is not configured' });
    }

    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
    const scopedPath = `${userId}/${sanitizedPath}`;
    const exists = await bunnyStorage.fileExists(scopedPath);

    res.json({ exists, path: scopedPath });
  } catch (error) {
    console.error('Error checking file existence:', error);
    res.status(500).json({ error: 'Failed to check file existence' });
  }
});

// Delete a file
router.delete('/file', isAuthenticated, async (req: any, res) => {
  try {
    if (!bunnyStorage.isBunnyConfigured()) {
      return res.status(503).json({ error: 'Bunny Storage is not configured' });
    }

    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
    const scopedPath = `${userId}/${sanitizedPath}`;
    await bunnyStorage.deleteFile(scopedPath);

    res.json({ success: true, path: scopedPath });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Download a file (proxy through server)
router.get('/download', isAuthenticated, async (req: any, res) => {
  try {
    if (!bunnyStorage.isBunnyConfigured()) {
      return res.status(503).json({ error: 'Bunny Storage is not configured' });
    }

    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
    const scopedPath = `${userId}/${sanitizedPath}`;
    const fileBuffer = await bunnyStorage.downloadFile(scopedPath);

    // Get filename from path
    const filename = scopedPath.split('/').pop() || 'download';

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;

