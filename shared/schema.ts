import { z } from "zod";

// Test Set Schema
export interface TestSet {
  id: string;
  name: string;
  createdAt: string;
  questions: Question[];
}

export interface Question {
  id: string;
  filename: string;
  duration: string;
  url: string;
  order: number;
}

export const insertTestSetSchema = z.object({
  name: z.string().min(1),
  questions: z.array(z.object({
    filename: z.string(),
    duration: z.string(),
    url: z.string(),
    order: z.number(),
  })),
});

export type InsertTestSet = z.infer<typeof insertTestSetSchema>;

// Recording submission schema
export interface Recording {
  questionId: string;
  questionOrder: number;
  recordingBlob: Blob;
}

export interface TestSubmission {
  testSetId: string;
  recordings: Recording[];
  instructorEmail: string;
}

export const submitTestSchema = z.object({
  testSetId: z.string(),
  instructorEmail: z.string().email(),
});

export type SubmitTest = z.infer<typeof submitTestSchema>;
