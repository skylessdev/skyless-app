import { sql } from "drizzle-orm";
import { pgTable, text, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  email: text("email").unique(),
  walletAddress: text("wallet_address").unique(),
  connectionType: text("connection_type", { enum: ["email", "wallet", "anonymous"] }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  // Dashboard extensions
  identityVector: real("identity_vector").array().default(sql`ARRAY[0.5,0.5,0.5,0.5]`),
  lastLogin: timestamp("last_login"),
  growthSinceLast: real("growth_since_last").default(0.0),
  preferredMood: text("preferred_mood", { enum: ["contemplative", "reflective", "quiet", "social"] }).default("contemplative"),
});

export const userSessions = pgTable("user_sessions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sessionStart: timestamp("session_start").default(sql`CURRENT_TIMESTAMP`).notNull(),
  sessionEnd: timestamp("session_end"),
  vectorAtStart: real("vector_at_start").array(),
  vectorAtEnd: real("vector_at_end").array(),
  growthDelta: real("growth_delta").default(0.0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const reflections = pgTable("reflections", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  vectorDelta: real("vector_delta").array(),
  mood: text("mood").default("neutral"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  isWhisper: boolean("is_whisper").default(false),
});

export const networkWhispers = pgTable("network_whispers", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  content: text("content").notNull(),
  sourceReflectionId: integer("source_reflection_id").references(() => reflections.id),
  resonanceScore: real("resonance_score").default(0.0),
  resonanceCount: integer("resonance_count").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  isActive: boolean("is_active").default(true),
});

export const whisperResonances = pgTable("whisper_resonances", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  whisperId: integer("whisper_id").references(() => networkWhispers.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  reflections: many(reflections),
  resonances: many(whisperResonances),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, { fields: [userSessions.userId], references: [users.id] }),
}));

export const reflectionsRelations = relations(reflections, ({ one }) => ({
  user: one(users, { fields: [reflections.userId], references: [users.id] }),
  whisper: one(networkWhispers, { fields: [reflections.id], references: [networkWhispers.sourceReflectionId] }),
}));

export const networkWhispersRelations = relations(networkWhispers, ({ one, many }) => ({
  sourceReflection: one(reflections, { fields: [networkWhispers.sourceReflectionId], references: [reflections.id] }),
  resonances: many(whisperResonances),
}));

export const whisperResonancesRelations = relations(whisperResonances, ({ one }) => ({
  user: one(users, { fields: [whisperResonances.userId], references: [users.id] }),
  whisper: one(networkWhispers, { fields: [whisperResonances.whisperId], references: [networkWhispers.id] }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
  growthSinceLast: true,
  identityVector: true,
});

export const insertReflectionSchema = createInsertSchema(reflections).omit({
  id: true,
  createdAt: true,
  vectorDelta: true,
});

export const insertWhisperSchema = createInsertSchema(networkWhispers).omit({
  id: true,
  createdAt: true,
  resonanceScore: true,
  resonanceCount: true,
});

export const connectWalletSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export const signupEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const createReflectionSchema = z.object({
  userId: z.number(),
  content: z.string().min(1, "Content is required").max(500, "Content too long"),
  isAnonymous: z.boolean().default(true),
  canBeWhisper: z.boolean().default(true),
});

export const updateMoodSchema = z.object({
  userId: z.number(),
  mood: z.enum(["contemplative", "reflective", "quiet", "social"]),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type Reflection = typeof reflections.$inferSelect;
export type NetworkWhisper = typeof networkWhispers.$inferSelect;
export type WhisperResonance = typeof whisperResonances.$inferSelect;

export type ConnectWalletRequest = z.infer<typeof connectWalletSchema>;
export type SignupEmailRequest = z.infer<typeof signupEmailSchema>;
export type CreateReflectionRequest = z.infer<typeof createReflectionSchema>;
export type UpdateMoodRequest = z.infer<typeof updateMoodSchema>;
