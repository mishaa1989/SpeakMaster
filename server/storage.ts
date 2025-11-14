import { type TestSet, type Question } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Test Set operations
  createTestSet(name: string, questions: Omit<Question, 'id'>[]): Promise<TestSet>;
  getTestSet(id: string): Promise<TestSet | undefined>;
  getAllTestSets(): Promise<TestSet[]>;
  deleteTestSet(id: string): Promise<boolean>;
  deleteQuestion(testSetId: string, questionId: string): Promise<boolean>;
  
  // Recording operations
  saveRecording(testSetId: string, questionId: string, blob: Buffer): Promise<string>;
  getRecording(recordingId: string): Promise<Buffer | undefined>;
  getAllRecordingsForTest(testSetId: string): Promise<Map<string, Buffer>>;
}

export class MemStorage implements IStorage {
  private testSets: Map<string, TestSet>;
  private recordings: Map<string, Buffer>; // recordingId -> audio data
  private testRecordings: Map<string, Map<string, string>>; // testSetId -> (questionId -> recordingId)

  constructor() {
    this.testSets = new Map();
    this.recordings = new Map();
    this.testRecordings = new Map();
  }

  async createTestSet(name: string, questions: Omit<Question, 'id'>[]): Promise<TestSet> {
    const id = randomUUID();
    const questionsWithIds: Question[] = questions.map(q => ({
      ...q,
      id: randomUUID(),
    }));
    
    const testSet: TestSet = {
      id,
      name,
      createdAt: new Date().toISOString().split('T')[0],
      questions: questionsWithIds,
    };
    
    this.testSets.set(id, testSet);
    return testSet;
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
      this.testRecordings.delete(id);
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

  async saveRecording(testSetId: string, questionId: string, blob: Buffer): Promise<string> {
    const recordingId = randomUUID();
    this.recordings.set(recordingId, blob);
    
    if (!this.testRecordings.has(testSetId)) {
      this.testRecordings.set(testSetId, new Map());
    }
    this.testRecordings.get(testSetId)!.set(questionId, recordingId);
    
    return recordingId;
  }

  async getRecording(recordingId: string): Promise<Buffer | undefined> {
    return this.recordings.get(recordingId);
  }

  async getAllRecordingsForTest(testSetId: string): Promise<Map<string, Buffer>> {
    const result = new Map<string, Buffer>();
    const testRecs = this.testRecordings.get(testSetId);
    
    if (testRecs) {
      const entries = Array.from(testRecs.entries());
      for (const [questionId, recordingId] of entries) {
        const recording = this.recordings.get(recordingId);
        if (recording) {
          result.set(questionId, recording);
        }
      }
    }
    
    return result;
  }
}

export const storage = new MemStorage();
