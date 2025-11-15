import { z } from "zod";
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Drizzle Database Tables
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testSets = pgTable("test_sets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  instructorEmail: text("instructor_email").notNull(),
  language: text("language").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testSetId: integer("test_set_id").notNull().references(() => testSets.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  duration: text("duration").notNull(),
  order: integer("order").notNull(),
  audioData: text("audio_data").notNull(), // Base64 encoded audio
});

export const studentRecordings = pgTable("student_recordings", {
  id: serial("id").primaryKey(),
  testSetId: integer("test_set_id").notNull().references(() => testSets.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  recordingData: text("recording_data").notNull(), // Base64 encoded recording
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  testSetId: integer("test_set_id").notNull().references(() => testSets.id, { onDelete: "cascade" }),
  testSetName: text("test_set_name").notNull(),
  studentName: text("student_name").notNull(),
  language: text("language").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  recordingCount: integer("recording_count").notNull(),
});

export const submissionRecordings = pgTable("submission_recordings", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
  recordingIndex: integer("recording_index").notNull(),
  recordingData: text("recording_data").notNull(), // Base64 encoded recording
});

// Type exports for database tables
export type AdminSettingsRow = typeof adminSettings.$inferSelect;
export type TestSetRow = typeof testSets.$inferSelect;
export type QuestionRow = typeof questions.$inferSelect;
export type StudentRecordingRow = typeof studentRecordings.$inferSelect;
export type SubmissionRow = typeof submissions.$inferSelect;
export type SubmissionRecordingRow = typeof submissionRecordings.$inferSelect;

// Test Set Schema
export interface TestSet {
  id: string;
  name: string;
  createdAt: string;
  instructorEmail: string;
  language: string;
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
  instructorEmail: z.string().email(),
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

// Submission stored in file system
export interface Submission {
  id: string;
  testSetId: string;
  testSetName: string;
  studentName: string;
  language: string;
  submittedAt: string;
  recordingCount: number; // Number of recordings
}

export const submitTestSchema = z.object({
  testSetId: z.string(),
  studentName: z.string().min(1),
  language: z.string().min(1),
});

export type SubmitTest = z.infer<typeof submitTestSchema>;
