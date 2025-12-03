import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { DbStorage } from "./storage";
import multer from "multer";
import { insertTestSetSchema } from "@shared/schema";
import archiver from "archiver";
import bcrypt from "bcrypt";

const storage = new DbStorage();

const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/mpeg', 
      'audio/mp3', 
      'audio/webm',
      'audio/wav',
      'audio/x-wav',
      'audio/wave'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.isAdminAuthenticated === true) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all test sets - Admin only (full details)
  app.get('/api/test-sets', requireAuth, async (req, res) => {
    try {
      const testSets = await storage.getAllTestSets();
      res.json(testSets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch test sets' });
    }
  });

  // Get all test sets for students (public, limited info)
  app.get('/api/public/test-sets', async (req, res) => {
    try {
      const testSets = await storage.getAllTestSets();
      // Return only necessary info for students (no instructor email)
      const publicTestSets = testSets.map(ts => ({
        id: ts.id,
        name: ts.name,
        language: ts.language,
        questionCount: ts.questions.length,
      }));
      res.json(publicTestSets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch test sets' });
    }
  });

  // Verify access code (public)
  app.post('/api/public/verify-access-code', async (req, res) => {
    try {
      const { accessCode } = req.body;
      
      if (!accessCode || accessCode.length !== 6) {
        return res.status(400).json({ error: '6자리 승인코드를 입력해주세요' });
      }

      const testSet = await storage.getTestSetByAccessCode(accessCode);
      
      if (!testSet) {
        return res.status(404).json({ error: '유효하지 않은 승인코드입니다' });
      }

      // Return test set info for valid access code
      res.json({
        success: true,
        testSet: {
          id: testSet.id,
          name: testSet.name,
          language: testSet.language,
          questionCount: testSet.questions.length,
        }
      });
    } catch (error) {
      console.error('Error verifying access code:', error);
      res.status(500).json({ error: '승인코드 확인에 실패했습니다' });
    }
  });

  // Get a single test set - Admin only (includes sensitive data)
  app.get('/api/test-sets/:id', requireAuth, async (req, res) => {
    try {
      const testSet = await storage.getTestSet(req.params.id);
      if (!testSet) {
        return res.status(404).json({ error: 'Test set not found' });
      }
      res.json(testSet);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch test set' });
    }
  });

  // Get a single test set for students (public, excludes sensitive data)
  app.get('/api/public/test-sets/:id', async (req, res) => {
    try {
      const testSet = await storage.getTestSet(req.params.id);
      if (!testSet) {
        return res.status(404).json({ error: 'Test set not found' });
      }
      // Return only necessary info (no instructor email, no access code)
      res.json({
        id: testSet.id,
        name: testSet.name,
        language: testSet.language,
        createdAt: testSet.createdAt,
        questions: testSet.questions,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch test set' });
    }
  });

  // Create new test set with MP3 uploads - Admin only
  app.post('/api/test-sets', requireAuth, upload.array('files', 50), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const { name, durations, instructorEmail, language } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Test set name is required' });
      }
      
      if (!instructorEmail) {
        return res.status(400).json({ error: 'Instructor email is required' });
      }

      if (!language) {
        return res.status(400).json({ error: 'Language is required' });
      }

      const parsedDurations = durations ? JSON.parse(durations) : [];
      
      const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      const questions = files.map((file, index) => ({
        filename: file.originalname,
        duration: parsedDurations[index] ? formatDuration(parsedDurations[index]) : '0:00',
        url: '',
        order: index + 1,
      }));

      const testSet = await storage.createTestSet(name, instructorEmail, language, questions);
      
      // Store question audio files and update URLs
      for (let i = 0; i < files.length; i++) {
        const questionId = testSet.questions[i].id;
        await storage.saveQuestionAudio(testSet.id, questionId, files[i].buffer);
        testSet.questions[i].url = `/api/test-sets/${testSet.id}/questions/${questionId}/audio`;
      }

      res.status(201).json(testSet);
    } catch (error) {
      console.error('Error creating test set:', error);
      res.status(500).json({ error: 'Failed to create test set' });
    }
  });

  // Delete test set - Admin only
  app.delete('/api/test-sets/:id', requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteTestSet(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Test set not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete test set' });
    }
  });

  // Delete question from test set - Admin only
  app.delete('/api/test-sets/:testSetId/questions/:questionId', requireAuth, async (req, res) => {
    try {
      const { testSetId, questionId } = req.params;
      const deleted = await storage.deleteQuestion(testSetId, questionId);
      if (!deleted) {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete question' });
    }
  });

  // Get question audio file
  app.get('/api/test-sets/:testSetId/questions/:questionId/audio', async (req, res) => {
    try {
      const { testSetId, questionId } = req.params;
      const audioBuffer = await storage.getQuestionAudio(testSetId, questionId);
      
      if (!audioBuffer) {
        return res.status(404).json({ error: 'Audio file not found' });
      }
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length.toString());
      res.send(audioBuffer);
    } catch (error) {
      console.error('Error fetching audio:', error);
      res.status(500).json({ error: 'Failed to fetch audio' });
    }
  });

  // Get all submissions - Admin only
  app.get('/api/submissions', requireAuth, async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  // Get a specific submission - Admin only
  app.get('/api/submissions/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const submission = await storage.getSubmission(id);
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      res.json(submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  });

  // Delete submission - Admin only
  app.delete('/api/submissions/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSubmission(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting submission:', error);
      res.status(500).json({ error: 'Failed to delete submission' });
    }
  });

  // Download submission recordings as ZIP - Admin only
  app.get('/api/submissions/:id/download', requireAuth, async (req, res) => {
    const { id } = req.params;
    const submission = await storage.getSubmission(id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Create archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Set response headers
    const filename = `${submission.studentName}_${submission.testSetName}_${new Date(submission.submittedAt).toISOString().split('T')[0]}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    // Handle archiver warnings and errors
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err);
      } else {
        console.error('Archive warning (non-ENOENT):', err);
      }
    });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create archive' });
      }
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add each recording to the archive
    console.log(`Adding ${submission.recordingCount} recordings to ZIP...`);
    for (let i = 0; i < submission.recordingCount; i++) {
      const recording = await storage.getSubmissionRecording(id, i);
      if (recording) {
        console.log(`  Recording ${i + 1}: ${recording.length} bytes`);
        // Convert Buffer to Stream for archiver
        const { Readable } = await import('stream');
        const stream = Readable.from(recording);
        // Use .wav extension for merged recordings, .webm for legacy
        const extension = submission.recordingCount === 1 ? 'wav' : 'webm';
        archive.append(stream, { 
          name: submission.recordingCount === 1 ? `recording.${extension}` : `question_${i + 1}.${extension}`
        });
      } else {
        console.log(`  Recording ${i + 1}: NOT FOUND`);
      }
    }

    // Finalize the archive (this signals no more files will be appended)
    console.log('Finalizing archive...');
    archive.finalize();
  });

  // Submit student recordings (single merged file)
  app.post('/api/submit-test', upload.single('recording'), async (req, res) => {
    try {
      console.log('Submit test request received');
      console.log('Body:', req.body);
      console.log('File:', req.file);
      
      const file = req.file;
      const { testSetId, studentName, language } = req.body;

      if (!testSetId || !studentName || !language) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!file) {
        console.error('No file received');
        return res.status(400).json({ error: 'No recording submitted' });
      }
      
      console.log(`Received merged recording from ${studentName} for language: ${language}, size: ${file.size} bytes`);

      const testSet = await storage.getTestSet(testSetId);
      if (!testSet) {
        return res.status(404).json({ error: 'Test set not found' });
      }

      // Save submission with single merged recording
      const submission = await storage.saveSubmission(
        testSetId,
        testSet.name,
        studentName,
        language,
        [file.buffer]
      );

      console.log(`Submission saved with ID: ${submission.id}`);
      res.json({ success: true, message: 'Test submitted successfully', submissionId: submission.id });
    } catch (error) {
      console.error('Error submitting test:', error);
      res.status(500).json({ error: 'Failed to submit test' });
    }
  });

  // Check if admin setup is required
  app.get('/api/admin/setup-required', async (req, res) => {
    try {
      const isPasswordSet = await storage.isAdminPasswordSet();
      res.json({ setupRequired: !isPasswordSet });
    } catch (error) {
      console.error('Error checking setup status:', error);
      res.status(500).json({ error: 'Failed to check setup status' });
    }
  });

  // Initial admin setup
  app.post('/api/admin/setup', async (req, res) => {
    try {
      // Check if password is already set
      const isPasswordSet = await storage.isAdminPasswordSet();
      if (isPasswordSet) {
        return res.status(400).json({ error: 'Admin password already configured' });
      }

      const { password } = req.body;
      if (!password || password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
      }

      // Hash password and save
      const passwordHash = await bcrypt.hash(password, 10);
      await storage.setAdminPassword(passwordHash);

      // Automatically log in after setup
      req.session.isAdminAuthenticated = true;
      res.json({ success: true, message: 'Admin password set successfully' });
    } catch (error) {
      console.error('Setup error:', error);
      res.status(500).json({ error: 'Failed to set up admin password' });
    }
  });

  // Admin login routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { password } = req.body;

      // Get password hash from database
      const passwordHash = await storage.getAdminPasswordHash();
      if (!passwordHash) {
        return res.status(500).json({ error: 'Admin password not configured' });
      }

      // Compare password with hash
      const isValid = await bcrypt.compare(password, passwordHash);
      if (isValid) {
        req.session.isAdminAuthenticated = true;
        res.json({ success: true, message: 'Login successful' });
      } else {
        res.status(401).json({ error: 'Invalid password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/admin/logout', async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logout successful' });
      });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  app.get('/api/admin/check', async (req, res) => {
    try {
      const isAuthenticated = req.session.isAdminAuthenticated === true;
      res.json({ authenticated: isAuthenticated });
    } catch (error) {
      res.status(500).json({ error: 'Check failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
