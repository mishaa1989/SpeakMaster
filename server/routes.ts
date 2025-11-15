import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertTestSetSchema } from "@shared/schema";
import nodemailer from "nodemailer";

const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') {
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
  app.post('/api/test-sets', upload.array('files', 15), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const { name, durations } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Test set name is required' });
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

      const testSet = await storage.createTestSet(name, questions);
      
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

  // Submit student recordings
  app.post('/api/submit-test', upload.array('recordings', 15), async (req, res) => {
    try {
      console.log('Submit test request received');
      console.log('Body:', req.body);
      console.log('Files:', req.files);
      
      const files = req.files as Express.Multer.File[];
      const { testSetId, instructorEmail } = req.body;

      if (!testSetId || !instructorEmail) {
        console.error('Missing fields - testSetId:', testSetId, 'instructorEmail:', instructorEmail);
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!files || files.length === 0) {
        console.error('No files received');
        return res.status(400).json({ error: 'No recordings submitted' });
      }
      
      console.log(`Received ${files.length} recording files`);

      const testSet = await storage.getTestSet(testSetId);
      if (!testSet) {
        return res.status(404).json({ error: 'Test set not found' });
      }

      // Save student recordings
      for (let i = 0; i < files.length; i++) {
        const questionId = testSet.questions[i]?.id;
        if (questionId) {
          await storage.saveStudentRecording(testSetId, questionId, files[i].buffer);
        }
      }

      // Send email with recordings
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        const attachments = files.map((file, index) => ({
          filename: `question_${index + 1}_answer.webm`,
          content: file.buffer,
        }));

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: instructorEmail,
          subject: `모의 OPIC 테스트 제출 - ${testSet.name}`,
          text: `학생이 ${testSet.name}을 완료했습니다. 총 ${files.length}개의 답변이 첨부되어 있습니다.`,
          html: `
            <h2>모의 OPIC 테스트 제출</h2>
            <p><strong>테스트:</strong> ${testSet.name}</p>
            <p><strong>제출 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
            <p><strong>답변 수:</strong> ${files.length}개</p>
            <p>첨부된 녹음 파일을 확인해주세요.</p>
          `,
          attachments,
        });

        res.json({ success: true, message: 'Test submitted successfully' });
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Still return success even if email fails
        res.json({ success: true, message: 'Test submitted (email pending)' });
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      res.status(500).json({ error: 'Failed to submit test' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
