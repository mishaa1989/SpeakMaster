import { type TestSet, type Question } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Test Set operations
  createTestSet(name: string, instructorEmail: string, questions: Omit<Question, 'id'>[]): Promise<TestSet>;
  updateTestSetEmail(id: string, instructorEmail: string): Promise<boolean>;
  getTestSet(id: string): Promise<TestSet | undefined>;
  getAllTestSets(): Promise<TestSet[]>;
  deleteTestSet(id: string): Promise<boolean>;
  deleteQuestion(testSetId: string, questionId: string): Promise<boolean>;
  
  // Question audio operations
  saveQuestionAudio(testSetId: string, questionId: string, blob: Buffer): Promise<void>;
  getQuestionAudio(testSetId: string, questionId: string): Promise<Buffer | undefined>;
  
  // Student recording operations
  saveStudentRecording(testSetId: string, questionId: string, blob: Buffer): Promise<string>;
  getStudentRecording(recordingId: string): Promise<Buffer | undefined>;
  getAllStudentRecordingsForTest(testSetId: string): Promise<Map<string, Buffer>>;
}

export class MemStorage implements IStorage {
  private testSets: Map<string, TestSet>;
  private questionAudio: Map<string, Map<string, Buffer>>; // testSetId -> (questionId -> audio buffer)
  private studentRecordings: Map<string, Buffer>; // recordingId -> audio data
  private testStudentRecordings: Map<string, Map<string, string>>; // testSetId -> (questionId -> recordingId)

  constructor() {
    this.testSets = new Map();
    this.questionAudio = new Map();
    this.studentRecordings = new Map();
    this.testStudentRecordings = new Map();
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
    
    this.testSets.set(id, testSet);
    return testSet;
  }

  async updateTestSetEmail(id: string, instructorEmail: string): Promise<boolean> {
    const testSet = this.testSets.get(id);
    if (!testSet) return false;
    
    testSet.instructorEmail = instructorEmail;
    this.testSets.set(id, testSet);
    return true;
  }

  async getTestSet(id: string): Promise<TestSet | undefined> {
    return this.testSets.get(id);
  }

  async getAllTestSets(): Promise<TestSet[]> {
    return Array.from(this.testSets.values());
  }

  async deleteTestSet(id: string): Promise<boolean> {
    const deleted = this.testSets.delete(id);
    if (deleted) {
      this.questionAudio.delete(id);
      this.testStudentRecordings.delete(id);
    }
    return deleted;
  }

  async deleteQuestion(testSetId: string, questionId: string): Promise<boolean> {
    const testSet = this.testSets.get(testSetId);
    if (!testSet) return false;
    
    const updatedQuestions = testSet.questions.filter(q => q.id !== questionId);
    if (updatedQuestions.length === testSet.questions.length) return false;
    
    testSet.questions = updatedQuestions;
    this.testSets.set(testSetId, testSet);
    return true;
  }

  async saveQuestionAudio(testSetId: string, questionId: string, blob: Buffer): Promise<void> {
    if (!this.questionAudio.has(testSetId)) {
      this.questionAudio.set(testSetId, new Map());
    }
    this.questionAudio.get(testSetId)!.set(questionId, blob);
  }

  async getQuestionAudio(testSetId: string, questionId: string): Promise<Buffer | undefined> {
    const testAudio = this.questionAudio.get(testSetId);
    if (!testAudio) return undefined;
    return testAudio.get(questionId);
  }

  async saveStudentRecording(testSetId: string, questionId: string, blob: Buffer): Promise<string> {
    const recordingId = randomUUID();
    this.studentRecordings.set(recordingId, blob);
    
    if (!this.testStudentRecordings.has(testSetId)) {
      this.testStudentRecordings.set(testSetId, new Map());
    }
    this.testStudentRecordings.get(testSetId)!.set(questionId, recordingId);
    
    return recordingId;
  }

  async getStudentRecording(recordingId: string): Promise<Buffer | undefined> {
    return this.studentRecordings.get(recordingId);
  }

  async getAllStudentRecordingsForTest(testSetId: string): Promise<Map<string, Buffer>> {
    const result = new Map<string, Buffer>();
    const testRecs = this.testStudentRecordings.get(testSetId);
    
    if (testRecs) {
      const entries = Array.from(testRecs.entries());
      for (const [questionId, recordingId] of entries) {
        const recording = this.studentRecordings.get(recordingId);
        if (recording) {
          result.set(questionId, recording);
        }
      }
    }
    
    return result;
  }
}

export const storage = new MemStorage();
