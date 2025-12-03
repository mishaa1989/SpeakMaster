import { type TestSet, type Question, type Submission, testSets, questions, studentRecordings, adminSettings, submissions, submissionRecordings } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Generate 6-character random access code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface IStorage {
  // Admin settings operations
  isAdminPasswordSet(): Promise<boolean>;
  setAdminPassword(passwordHash: string): Promise<void>;
  getAdminPasswordHash(): Promise<string | undefined>;
  
  // Test Set operations
  createTestSet(name: string, instructorEmail: string, language: string, questions: Omit<Question, 'id'>[]): Promise<TestSet>;
  updateTestSetEmail(id: string, instructorEmail: string): Promise<boolean>;
  regenerateAccessCode(id: string): Promise<string | undefined>;
  getTestSet(id: string): Promise<TestSet | undefined>;
  getTestSetByAccessCode(accessCode: string): Promise<TestSet | undefined>;
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
  
  // Submission operations
  saveSubmission(testSetId: string, testSetName: string, studentName: string, language: string, recordings: Buffer[]): Promise<Submission>;
  getAllSubmissions(): Promise<Submission[]>;
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionRecording(submissionId: string, recordingIndex: number): Promise<Buffer | undefined>;
  deleteSubmission(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private adminPasswordHash: string | undefined;
  private testSets: Map<string, TestSet>;
  private questionAudio: Map<string, Map<string, Buffer>>; // testSetId -> (questionId -> audio buffer)
  private studentRecordings: Map<string, Buffer>; // recordingId -> audio data
  private testStudentRecordings: Map<string, Map<string, string>>; // testSetId -> (questionId -> recordingId)

  constructor() {
    this.adminPasswordHash = undefined;
    this.testSets = new Map();
    this.questionAudio = new Map();
    this.studentRecordings = new Map();
    this.testStudentRecordings = new Map();
  }

  async isAdminPasswordSet(): Promise<boolean> {
    return this.adminPasswordHash !== undefined;
  }

  async setAdminPassword(passwordHash: string): Promise<void> {
    this.adminPasswordHash = passwordHash;
  }

  async getAdminPasswordHash(): Promise<string | undefined> {
    return this.adminPasswordHash;
  }

  async createTestSet(name: string, instructorEmail: string, language: string, questions: Omit<Question, 'id'>[]): Promise<TestSet> {
    const id = randomUUID();
    const questionsWithIds: Question[] = questions.map(q => ({
      ...q,
      id: randomUUID(),
    }));
    
    const testSet: TestSet = {
      id,
      name,
      instructorEmail,
      language,
      accessCode: generateAccessCode(),
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

  async regenerateAccessCode(id: string): Promise<string | undefined> {
    const testSet = this.testSets.get(id);
    if (!testSet) return undefined;
    
    const newCode = generateAccessCode();
    testSet.accessCode = newCode;
    this.testSets.set(id, testSet);
    return newCode;
  }

  async getTestSet(id: string): Promise<TestSet | undefined> {
    return this.testSets.get(id);
  }

  async getTestSetByAccessCode(accessCode: string): Promise<TestSet | undefined> {
    for (const testSet of this.testSets.values()) {
      if (testSet.accessCode === accessCode) {
        return testSet;
      }
    }
    return undefined;
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

  async saveSubmission(testSetId: string, testSetName: string, studentName: string, language: string, recordings: Buffer[]): Promise<Submission> {
    throw new Error("Not implemented in MemStorage - use DbStorage");
  }

  async getAllSubmissions(): Promise<Submission[]> {
    throw new Error("Not implemented in MemStorage - use DbStorage");
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    throw new Error("Not implemented in MemStorage - use DbStorage");
  }

  async getSubmissionRecording(submissionId: string, recordingIndex: number): Promise<Buffer | undefined> {
    throw new Error("Not implemented in MemStorage - use DbStorage");
  }

  async deleteSubmission(id: string): Promise<boolean> {
    throw new Error("Not implemented in MemStorage - use DbStorage");
  }
}

export class DbStorage implements IStorage {
  async isAdminPasswordSet(): Promise<boolean> {
    const [settings] = await db.select().from(adminSettings).limit(1);
    return settings !== undefined;
  }

  async setAdminPassword(passwordHash: string): Promise<void> {
    await db.delete(adminSettings);
    await db.insert(adminSettings).values({ passwordHash });
  }

  async getAdminPasswordHash(): Promise<string | undefined> {
    const [settings] = await db.select().from(adminSettings).limit(1);
    return settings?.passwordHash;
  }

  async createTestSet(name: string, instructorEmail: string, language: string, questionsData: Omit<Question, 'id'>[]): Promise<TestSet> {
    const accessCode = generateAccessCode();
    
    // Create test set
    const [testSetRow] = await db.insert(testSets).values({
      name,
      instructorEmail,
      language,
      accessCode,
    }).returning();

    // Create questions with audio data
    const questionRows = await Promise.all(
      questionsData.map(async (q, index) => {
        const [questionRow] = await db.insert(questions).values({
          testSetId: testSetRow.id,
          filename: q.filename,
          duration: q.duration,
          order: q.order,
          audioData: "", // Will be updated by saveQuestionAudio
        }).returning();
        return questionRow;
      })
    );

    // Convert to TestSet format
    return {
      id: testSetRow.id.toString(),
      name: testSetRow.name,
      instructorEmail: testSetRow.instructorEmail,
      language: testSetRow.language,
      accessCode: testSetRow.accessCode,
      createdAt: testSetRow.createdAt.toISOString().split('T')[0],
      questions: questionRows.map(q => ({
        id: q.id.toString(),
        filename: q.filename,
        duration: q.duration,
        url: `/api/test-sets/${testSetRow.id}/questions/${q.id}/audio`,
        order: q.order,
      })),
    };
  }

  async updateTestSetEmail(id: string, instructorEmail: string): Promise<boolean> {
    const result = await db.update(testSets)
      .set({ instructorEmail })
      .where(eq(testSets.id, parseInt(id)));
    return true;
  }

  async regenerateAccessCode(id: string): Promise<string | undefined> {
    const newCode = generateAccessCode();
    await db.update(testSets)
      .set({ accessCode: newCode })
      .where(eq(testSets.id, parseInt(id)));
    return newCode;
  }

  async getTestSet(id: string): Promise<TestSet | undefined> {
    const [testSetRow] = await db.select()
      .from(testSets)
      .where(eq(testSets.id, parseInt(id)));

    if (!testSetRow) return undefined;

    const questionRows = await db.select()
      .from(questions)
      .where(eq(questions.testSetId, parseInt(id)))
      .orderBy(questions.order);

    return {
      id: testSetRow.id.toString(),
      name: testSetRow.name,
      instructorEmail: testSetRow.instructorEmail,
      language: testSetRow.language,
      accessCode: testSetRow.accessCode,
      createdAt: testSetRow.createdAt.toISOString().split('T')[0],
      questions: questionRows.map(q => ({
        id: q.id.toString(),
        filename: q.filename,
        duration: q.duration,
        url: `/api/test-sets/${testSetRow.id}/questions/${q.id}/audio`,
        order: q.order,
      })),
    };
  }

  async getTestSetByAccessCode(accessCode: string): Promise<TestSet | undefined> {
    const [testSetRow] = await db.select()
      .from(testSets)
      .where(eq(testSets.accessCode, accessCode));

    if (!testSetRow) return undefined;

    const questionRows = await db.select()
      .from(questions)
      .where(eq(questions.testSetId, testSetRow.id))
      .orderBy(questions.order);

    return {
      id: testSetRow.id.toString(),
      name: testSetRow.name,
      instructorEmail: testSetRow.instructorEmail,
      language: testSetRow.language,
      accessCode: testSetRow.accessCode,
      createdAt: testSetRow.createdAt.toISOString().split('T')[0],
      questions: questionRows.map(q => ({
        id: q.id.toString(),
        filename: q.filename,
        duration: q.duration,
        url: `/api/test-sets/${testSetRow.id}/questions/${q.id}/audio`,
        order: q.order,
      })),
    };
  }

  async getAllTestSets(): Promise<TestSet[]> {
    const testSetRows = await db.select().from(testSets);
    
    const result = await Promise.all(
      testSetRows.map(async (testSetRow) => {
        const questionRows = await db.select()
          .from(questions)
          .where(eq(questions.testSetId, testSetRow.id))
          .orderBy(questions.order);

        return {
          id: testSetRow.id.toString(),
          name: testSetRow.name,
          instructorEmail: testSetRow.instructorEmail,
          language: testSetRow.language,
          accessCode: testSetRow.accessCode,
          createdAt: testSetRow.createdAt.toISOString().split('T')[0],
          questions: questionRows.map(q => ({
            id: q.id.toString(),
            filename: q.filename,
            duration: q.duration,
            url: `/api/test-sets/${testSetRow.id}/questions/${q.id}/audio`,
            order: q.order,
          })),
        };
      })
    );

    return result;
  }

  async deleteTestSet(id: string): Promise<boolean> {
    await db.delete(testSets).where(eq(testSets.id, parseInt(id)));
    return true;
  }

  async deleteQuestion(testSetId: string, questionId: string): Promise<boolean> {
    await db.delete(questions).where(
      and(
        eq(questions.id, parseInt(questionId)),
        eq(questions.testSetId, parseInt(testSetId))
      )
    );
    return true;
  }

  async saveQuestionAudio(testSetId: string, questionId: string, blob: Buffer): Promise<void> {
    const base64Audio = blob.toString('base64');
    await db.update(questions)
      .set({ audioData: base64Audio })
      .where(eq(questions.id, parseInt(questionId)));
  }

  async getQuestionAudio(testSetId: string, questionId: string): Promise<Buffer | undefined> {
    const [question] = await db.select()
      .from(questions)
      .where(
        and(
          eq(questions.id, parseInt(questionId)),
          eq(questions.testSetId, parseInt(testSetId))
        )
      );

    if (!question || !question.audioData) return undefined;
    return Buffer.from(question.audioData, 'base64');
  }

  async saveStudentRecording(testSetId: string, questionId: string, blob: Buffer): Promise<string> {
    const base64Recording = blob.toString('base64');
    const [recording] = await db.insert(studentRecordings).values({
      testSetId: parseInt(testSetId),
      questionId: parseInt(questionId),
      recordingData: base64Recording,
    }).returning();

    return recording.id.toString();
  }

  async getStudentRecording(recordingId: string): Promise<Buffer | undefined> {
    const [recording] = await db.select()
      .from(studentRecordings)
      .where(eq(studentRecordings.id, parseInt(recordingId)));

    if (!recording) return undefined;
    return Buffer.from(recording.recordingData, 'base64');
  }

  async getAllStudentRecordingsForTest(testSetId: string): Promise<Map<string, Buffer>> {
    const recordings = await db.select()
      .from(studentRecordings)
      .where(eq(studentRecordings.testSetId, parseInt(testSetId)));

    const result = new Map<string, Buffer>();
    for (const recording of recordings) {
      result.set(
        recording.questionId.toString(),
        Buffer.from(recording.recordingData, 'base64')
      );
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
    const [submission] = await db.insert(submissions).values({
      testSetId: parseInt(testSetId),
      testSetName,
      studentName,
      language,
      recordingCount: recordings.length,
    }).returning();

    await Promise.all(
      recordings.map((buffer, index) => 
        db.insert(submissionRecordings).values({
          submissionId: submission.id,
          recordingIndex: index,
          recordingData: buffer.toString('base64'),
        })
      )
    );

    return {
      id: submission.id.toString(),
      testSetId: submission.testSetId.toString(),
      testSetName: submission.testSetName,
      studentName: submission.studentName,
      language: submission.language,
      submittedAt: submission.submittedAt.toISOString(),
      recordingCount: submission.recordingCount,
    };
  }

  async getAllSubmissions(): Promise<Submission[]> {
    const submissionRows = await db.select().from(submissions);
    return submissionRows.map(row => ({
      id: row.id.toString(),
      testSetId: row.testSetId.toString(),
      testSetName: row.testSetName,
      studentName: row.studentName,
      language: row.language,
      submittedAt: row.submittedAt.toISOString(),
      recordingCount: row.recordingCount,
    }));
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select()
      .from(submissions)
      .where(eq(submissions.id, parseInt(id)));

    if (!submission) return undefined;

    return {
      id: submission.id.toString(),
      testSetId: submission.testSetId.toString(),
      testSetName: submission.testSetName,
      studentName: submission.studentName,
      language: submission.language,
      submittedAt: submission.submittedAt.toISOString(),
      recordingCount: submission.recordingCount,
    };
  }

  async getSubmissionRecording(submissionId: string, recordingIndex: number): Promise<Buffer | undefined> {
    const [recording] = await db.select()
      .from(submissionRecordings)
      .where(
        and(
          eq(submissionRecordings.submissionId, parseInt(submissionId)),
          eq(submissionRecordings.recordingIndex, recordingIndex)
        )
      );

    if (!recording) return undefined;
    return Buffer.from(recording.recordingData, 'base64');
  }

  async deleteSubmission(id: string): Promise<boolean> {
    await db.delete(submissions).where(eq(submissions.id, parseInt(id)));
    return true;
  }
}

export const storage = new DbStorage();
