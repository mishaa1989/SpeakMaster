import { type TestSet, type Question, type Submission } from "@shared/schema";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const TEST_SETS_FILE = path.join(DATA_DIR, "test-sets.json");
const AUDIO_DIR = path.join(DATA_DIR, "audio");
const RECORDINGS_DIR = path.join(DATA_DIR, "recordings");
const SUBMISSIONS_DIR = path.join(DATA_DIR, "submissions");

interface StorageData {
  testSets: Record<string, TestSet>;
  questionAudio: Record<string, Record<string, string>>; // testSetId -> questionId -> base64
  studentRecordings: Record<string, string>; // recordingId -> base64
  testStudentRecordings: Record<string, Record<string, string>>; // testSetId -> questionId -> recordingId
  submissions: Record<string, Submission>; // submissionId -> Submission
  submissionRecordings: Record<string, Record<string, string>>; // submissionId -> recordingIndex -> base64
}

export interface IStorage {
  createTestSet(name: string, instructorEmail: string, questions: Omit<Question, 'id'>[]): Promise<TestSet>;
  updateTestSetEmail(id: string, instructorEmail: string): Promise<boolean>;
  getTestSet(id: string): Promise<TestSet | undefined>;
  getAllTestSets(): Promise<TestSet[]>;
  deleteTestSet(id: string): Promise<boolean>;
  deleteQuestion(testSetId: string, questionId: string): Promise<boolean>;
  saveQuestionAudio(testSetId: string, questionId: string, blob: Buffer): Promise<void>;
  getQuestionAudio(testSetId: string, questionId: string): Promise<Buffer | undefined>;
  saveStudentRecording(testSetId: string, questionId: string, blob: Buffer): Promise<string>;
  getStudentRecording(recordingId: string): Promise<Buffer | undefined>;
  getAllStudentRecordingsForTest(testSetId: string): Promise<Map<string, Buffer>>;
  saveSubmission(testSetId: string, testSetName: string, studentName: string, language: string, recordings: Buffer[]): Promise<Submission>;
  getAllSubmissions(): Promise<Submission[]>;
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionRecording(submissionId: string, recordingIndex: number): Promise<Buffer | undefined>;
}

export class FileStorage implements IStorage {
  private data: StorageData = {
    testSets: {},
    questionAudio: {},
    studentRecordings: {},
    testStudentRecordings: {},
    submissions: {},
    submissionRecordings: {},
  };

  constructor() {
    this.init();
  }

  private async init() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.mkdir(AUDIO_DIR, { recursive: true });
      await fs.mkdir(RECORDINGS_DIR, { recursive: true });
      await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
      await this.load();
    } catch (err) {
      console.error("Failed to initialize storage:", err);
    }
  }

  private async load() {
    try {
      const content = await fs.readFile(TEST_SETS_FILE, "utf-8");
      this.data = JSON.parse(content);
      // Ensure all fields exist for backward compatibility
      if (!this.data.submissions) this.data.submissions = {};
      if (!this.data.submissionRecordings) this.data.submissionRecordings = {};
    } catch (err) {
      // File doesn't exist yet, use empty data
      this.data = {
        testSets: {},
        questionAudio: {},
        studentRecordings: {},
        testStudentRecordings: {},
        submissions: {},
        submissionRecordings: {},
      };
    }
  }

  private async save() {
    await fs.writeFile(TEST_SETS_FILE, JSON.stringify(this.data, null, 2));
  }

  async createTestSet(name: string, instructorEmail: string, questions: Omit<Question, 'id'>[]): Promise<TestSet> {
    const id = randomUUID();
    const questionsWithIds: Question[] = questions.map(q => ({
      ...q,
      id: randomUUID(),
    }));
    
    const testSet: TestSet = {
      id,
      name,
      instructorEmail,
      createdAt: new Date().toISOString().split('T')[0],
      questions: questionsWithIds,
    };
    
    this.data.testSets[id] = testSet;
    await this.save();
    return testSet;
  }

  async updateTestSetEmail(id: string, instructorEmail: string): Promise<boolean> {
    const testSet = this.data.testSets[id];
    if (!testSet) return false;
    
    testSet.instructorEmail = instructorEmail;
    this.data.testSets[id] = testSet;
    await this.save();
    return true;
  }

  async getTestSet(id: string): Promise<TestSet | undefined> {
    return this.data.testSets[id];
  }

  async getAllTestSets(): Promise<TestSet[]> {
    return Object.values(this.data.testSets);
  }

  async deleteTestSet(id: string): Promise<boolean> {
    if (!this.data.testSets[id]) return false;
    
    delete this.data.testSets[id];
    delete this.data.questionAudio[id];
    delete this.data.testStudentRecordings[id];
    await this.save();
    return true;
  }

  async deleteQuestion(testSetId: string, questionId: string): Promise<boolean> {
    const testSet = this.data.testSets[testSetId];
    if (!testSet) return false;
    
    const updatedQuestions = testSet.questions.filter(q => q.id !== questionId);
    if (updatedQuestions.length === testSet.questions.length) return false;
    
    testSet.questions = updatedQuestions;
    this.data.testSets[testSetId] = testSet;
    
    // Remove audio
    if (this.data.questionAudio[testSetId]) {
      delete this.data.questionAudio[testSetId][questionId];
    }
    
    await this.save();
    return true;
  }

  async saveQuestionAudio(testSetId: string, questionId: string, blob: Buffer): Promise<void> {
    if (!this.data.questionAudio[testSetId]) {
      this.data.questionAudio[testSetId] = {};
    }
    this.data.questionAudio[testSetId][questionId] = blob.toString('base64');
    await this.save();
  }

  async getQuestionAudio(testSetId: string, questionId: string): Promise<Buffer | undefined> {
    const audio = this.data.questionAudio[testSetId]?.[questionId];
    if (!audio) return undefined;
    return Buffer.from(audio, 'base64');
  }

  async saveStudentRecording(testSetId: string, questionId: string, blob: Buffer): Promise<string> {
    const recordingId = randomUUID();
    this.data.studentRecordings[recordingId] = blob.toString('base64');
    
    if (!this.data.testStudentRecordings[testSetId]) {
      this.data.testStudentRecordings[testSetId] = {};
    }
    this.data.testStudentRecordings[testSetId][questionId] = recordingId;
    
    await this.save();
    return recordingId;
  }

  async getStudentRecording(recordingId: string): Promise<Buffer | undefined> {
    const recording = this.data.studentRecordings[recordingId];
    if (!recording) return undefined;
    return Buffer.from(recording, 'base64');
  }

  async getAllStudentRecordingsForTest(testSetId: string): Promise<Map<string, Buffer>> {
    const result = new Map<string, Buffer>();
    const testRecs = this.data.testStudentRecordings[testSetId];
    
    if (testRecs) {
      for (const [questionId, recordingId] of Object.entries(testRecs)) {
        const recording = this.data.studentRecordings[recordingId];
        if (recording) {
          result.set(questionId, Buffer.from(recording, 'base64'));
        }
      }
    }
    
    return result;
  }

  async saveSubmission(
    testSetId: string,
    testSetName: string,
    studentName: string,
    language: string,
    recordings: Buffer[]
  ): Promise<Submission> {
    const id = randomUUID();

    // Save each recording as base64 in memory storage
    if (!this.data.submissionRecordings[id]) {
      this.data.submissionRecordings[id] = {};
    }

    recordings.forEach((buffer, index) => {
      this.data.submissionRecordings[id][index.toString()] = buffer.toString('base64');
    });

    const submission: Submission = {
      id,
      testSetId,
      testSetName,
      studentName,
      language,
      submittedAt: new Date().toISOString(),
      recordingCount: recordings.length,
    };

    this.data.submissions[id] = submission;
    await this.save();
    return submission;
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return Object.values(this.data.submissions);
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    return this.data.submissions[id];
  }

  async getSubmissionRecording(submissionId: string, recordingIndex: number): Promise<Buffer | undefined> {
    const recording = this.data.submissionRecordings[submissionId]?.[recordingIndex.toString()];
    if (!recording) return undefined;
    return Buffer.from(recording, 'base64');
  }
}

export const storage = new FileStorage();
