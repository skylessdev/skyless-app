import { 
  users, userSessions, reflections, networkWhispers, whisperResonances,
  type User, type InsertUser, type UserSession, type Reflection, type NetworkWhisper, type WhisperResonance 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Original user methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Dashboard methods
  getDashboardData(userId: number): Promise<any>;
  startUserSession(userId: number): Promise<UserSession>;
  createReflection(userId: number, content: string, isAnonymous?: boolean): Promise<Reflection>;
  getNetworkWhispers(limit?: number): Promise<NetworkWhisper[]>;
  toggleWhisperResonance(userId: number, whisperId: number): Promise<{
    success: boolean;
    resonated: boolean;
    newCount: number;
    message: string;
  }>;
  getWhispersWithUserResonance(userId: number, limit?: number): Promise<Array<NetworkWhisper & { userHasResonated: boolean }>>;
  updateUserMood(userId: number, mood: string): Promise<User>;
  updateUserVector(userId: number, vector: number[]): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getDashboardData(userId: number): Promise<any> {
    // Get user with current vector
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    // Get last session to calculate growth
    const lastSession = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.sessionStart))
      .limit(1);

    // Get recent network whispers with user resonance status
    const whispers = await this.getWhispersWithUserResonance(userId, 3);

    // Calculate growth since last session
    let growthPercentage = 0;
    if (lastSession.length > 0 && lastSession[0].vectorAtEnd && user.identityVector) {
      const currentVector = user.identityVector;
      const lastVector = lastSession[0].vectorAtEnd;
      
      // Simple vector distance calculation
      const distance = Math.sqrt(
        currentVector.reduce((sum, val, i) => 
          sum + Math.pow(val - (lastVector[i] || 0.5), 2), 0)
      );
      growthPercentage = Math.round(distance * 100);
    }

    return {
      user: {
        id: user.id,
        identityVector: user.identityVector,
        preferredMood: user.preferredMood,
        connectionType: user.connectionType,
      },
      growthSinceLast: growthPercentage,
      networkWhispers: whispers,
      lastVisit: lastSession[0]?.sessionStart || null,
    };
  }

  async startUserSession(userId: number): Promise<UserSession> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    // Create new session
    const [session] = await db.insert(userSessions).values({
      userId,
      vectorAtStart: user.identityVector,
      sessionStart: new Date(),
    }).returning();

    // Update user's last login
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, userId));

    return session;
  }

  async createReflection(userId: number, content: string, isAnonymous: boolean = true): Promise<Reflection> {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required');
    }

    // Simple vector delta (small growth in coherence)
    const vectorDelta = [0, 0, 0, 0.1];

    // Save reflection
    const [reflection] = await db.insert(reflections).values({
      userId,
      content: content.trim(),
      isAnonymous,
      vectorDelta,
      isWhisper: true, // Every reflection becomes a whisper
      createdAt: new Date(),
    }).returning();

    // Automatically create network whisper
    await db.insert(networkWhispers).values({
      content: content.trim(),
      sourceReflectionId: reflection.id,
      resonanceCount: 0,
      createdAt: new Date(),
    });

    // Update user's identity vector
    const user = await this.getUser(userId);
    if (user && user.identityVector) {
      const currentVector = user.identityVector;
      const newVector = currentVector.map((val, i) => 
        Math.max(0, Math.min(1, val + (vectorDelta[i] || 0)))
      );

      await this.updateUserVector(userId, newVector);
    }

    return reflection;
  }

  async getNetworkWhispers(limit: number = 5): Promise<NetworkWhisper[]> {
    return await db
      .select()
      .from(networkWhispers)
      .where(eq(networkWhispers.isActive, true))
      .orderBy(desc(networkWhispers.createdAt))
      .limit(limit);
  }

  async toggleWhisperResonance(userId: number, whisperId: number): Promise<{
    success: boolean;
    resonated: boolean;
    newCount: number;
    message: string;
  }> {
    // Check if already resonated
    const existing = await db
      .select()
      .from(whisperResonances)
      .where(and(
        eq(whisperResonances.userId, userId),
        eq(whisperResonances.whisperId, whisperId)
      ))
      .limit(1);

    let resonated: boolean;
    
    if (existing.length > 0) {
      // Remove resonance (un-resonate)
      await db
        .delete(whisperResonances)
        .where(and(
          eq(whisperResonances.userId, userId),
          eq(whisperResonances.whisperId, whisperId)
        ));
      
      // Update resonance count
      await db.update(networkWhispers)
        .set({ 
          resonanceCount: sql`${networkWhispers.resonanceCount} - 1`
        })
        .where(eq(networkWhispers.id, whisperId));

      resonated = false;
    } else {
      // Add resonance
      await db.insert(whisperResonances).values({
        userId,
        whisperId,
        createdAt: new Date(),
      });

      // Update resonance count
      await db.update(networkWhispers)
        .set({ 
          resonanceCount: sql`${networkWhispers.resonanceCount} + 1`
        })
        .where(eq(networkWhispers.id, whisperId));

      resonated = true;
    }

    // Get updated whisper data
    const [updatedWhisper] = await db
      .select()
      .from(networkWhispers)
      .where(eq(networkWhispers.id, whisperId))
      .limit(1);

    return {
      success: true,
      resonated,
      newCount: updatedWhisper.resonanceCount,
      message: resonated ? "Resonance added" : "Resonance removed"
    };
  }

  async getWhispersWithUserResonance(userId: number, limit: number = 5): Promise<Array<NetworkWhisper & { userHasResonated: boolean; authorWalletAddress?: string }>> {
    const whispers = await db
      .select({
        id: networkWhispers.id,
        content: networkWhispers.content,
        sourceReflectionId: networkWhispers.sourceReflectionId,
        resonanceScore: networkWhispers.resonanceScore,
        resonanceCount: networkWhispers.resonanceCount,
        createdAt: networkWhispers.createdAt,
        isActive: networkWhispers.isActive,
        userHasResonated: sql<boolean>`CASE WHEN ${whisperResonances.userId} IS NOT NULL THEN true ELSE false END`.as('user_has_resonated'),
        authorWalletAddress: users.walletAddress,
      })
      .from(networkWhispers)
      .leftJoin(reflections, eq(reflections.id, networkWhispers.sourceReflectionId))
      .leftJoin(users, eq(users.id, reflections.userId))
      .leftJoin(
        whisperResonances,
        and(
          eq(whisperResonances.whisperId, networkWhispers.id),
          eq(whisperResonances.userId, userId)
        )
      )
      .where(eq(networkWhispers.isActive, true))
      .orderBy(desc(networkWhispers.createdAt))
      .limit(limit);

    return whispers;
  }

  async updateUserMood(userId: number, mood: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ preferredMood: mood as any })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async updateUserVector(userId: number, vector: number[]): Promise<User> {
    const [user] = await db.update(users)
      .set({ identityVector: vector })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }
}

export const storage = new DatabaseStorage();
