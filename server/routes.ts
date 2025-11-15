import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./file-storage";
import multer from "multer";
import { insertTestSetSchema } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3' || file.mimetype === 'audio/webm') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all test sets
  app.get('/api/test-sets', async (req, res) => {
    try {
      const testSets = await storage.getAllTestSets();
      res.json(testSets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch test sets' });
    }
  });

  // Get a single test set
  app.get('/api/test-sets/:id', async (req, res) => {
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

  // Create new test set with MP3 uploads
  app.post('/api/test-sets', upload.array('files', 50), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const { name, durations, instructorEmail } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Test set name is required' });
      }
      
      if (!instructorEmail) {
        return res.status(400).json({ error: 'Instructor email is required' });
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

      const testSet = await storage.createTestSet(name, instructorEmail, questions);
      
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

  // Delete test set
  app.delete('/api/test-sets/:id', async (req, res) => {
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

  // Delete question from test set
  app.delete('/api/test-sets/:testSetId/questions/:questionId', async (req, res) => {
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

  // Get all submissions
  app.get('/api/submissions', async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  // Get a specific submission
  app.get('/api/submissions/:id', async (req, res) => {
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

  // Submit student recordings
  app.post('/api/submit-test', upload.array('recordings', 50), async (req, res) => {
    try {
      console.log('Submit test request received');
      console.log('Body:', req.body);
      console.log('Files:', req.files);
      
      const files = req.files as Express.Multer.File[];
      const { testSetId, studentName, language } = req.body;

      if (!testSetId || !studentName || !language) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!files || files.length === 0) {
        console.error('No files received');
        return res.status(400).json({ error: 'No recordings submitted' });
      }
      
      console.log(`Received ${files.length} recording files from ${studentName} for language: ${language}`);

      const testSet = await storage.getTestSet(testSetId);
      if (!testSet) {
        return res.status(404).json({ error: 'Test set not found' });
      }

      // Save submission
      const recordings = files.map(file => file.buffer);
      const submission = await storage.saveSubmission(
        testSetId,
        testSet.name,
        studentName,
        language,
        recordings
      );

      console.log(`Submission saved with ID: ${submission.id}`);
      res.json({ success: true, message: 'Test submitted successfully', submissionId: submission.id });
    } catch (error) {
      console.error('Error submitting test:', error);
      res.status(500).json({ error: 'Failed to submit test' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
