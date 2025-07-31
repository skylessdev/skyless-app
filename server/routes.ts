import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  connectWalletSchema, signupEmailSchema, createReflectionSchema, updateMoodSchema,
  type ConnectWalletRequest, type SignupEmailRequest, type CreateReflectionRequest, type UpdateMoodRequest 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Connect wallet endpoint
  app.post("/api/connect-wallet", async (req, res) => {
    try {
      const { walletAddress }: ConnectWalletRequest = connectWalletSchema.parse(req.body);
      
      // Check if wallet already exists
      let user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        // Create new user
        user = await storage.createUser({
          walletAddress,
          connectionType: "wallet",
          email: null,
        });
      }

      res.json({ 
        user_id: user.id,
        wallet_address: user.walletAddress,
        connection_type: 'wallet',
        message: "Wallet connected successfully" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid wallet address format" });
      }
      console.error("Wallet connection error:", error);
      res.status(500).json({ error: "Failed to connect wallet" });
    }
  });

  // Email signup endpoint
  app.post("/api/signup-email", async (req, res) => {
    try {
      const { email }: SignupEmailRequest = signupEmailSchema.parse(req.body);
      
      // Check if email already exists
      let user = await storage.getUserByEmail(email);
      if (!user) {
        // Create new user
        user = await storage.createUser({
          email,
          connectionType: "email",
          walletAddress: null,
        });
      }

      res.json({ 
        user_id: user.id,
        email: user.email,
        connection_type: 'email',
        message: "Email registered successfully" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      console.error("Email signup error:", error);
      res.status(500).json({ error: "Failed to register email" });
    }
  });

  // Anonymous session endpoint
  app.post("/api/anonymous-session", async (req, res) => {
    try {
      const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const user = await storage.createUser({
        connectionType: "anonymous",
        email: null,
        walletAddress: null,
      });

      res.json({ 
        user_id: user.id,
        anonymous_id: anonymousId,
        connection_type: 'anonymous',
        message: "Anonymous session created" 
      });
    } catch (error) {
      console.error("Anonymous session error:", error);
      res.status(500).json({ error: "Failed to create anonymous session" });
    }
  });

  // Get user by wallet
  app.get("/api/user/wallet/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const user = await storage.getUserByWallet(address);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Dashboard API Endpoints
  
  // GET /api/dashboard/:userId - Main dashboard data
  app.get("/api/dashboard/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const dashboardData = await storage.getDashboardData(userId);
      res.json(dashboardData);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  // POST /api/dashboard/start-session - Track when user enters dashboard
  app.post("/api/dashboard/start-session", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const session = await storage.startUserSession(userId);
      res.json({ sessionId: session.id });
    } catch (error) {
      console.error("Session start error:", error);
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  // POST /api/reflections - Submit a reflection/thought
  app.post("/api/reflections", async (req, res) => {
    try {
      console.log("Received reflection request:", req.body);
      const validatedData = createReflectionSchema.parse(req.body);
      const { userId, content, isAnonymous = true } = validatedData;

      // Verify user exists and session is valid
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Invalid session" });
      }

      const reflection = await storage.createReflection(userId, content, isAnonymous);

      res.json({ 
        reflectionId: reflection.id,
        message: "Reflection saved and shared with the network"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation error:", error.errors);
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Reflection save error:", error);
      res.status(500).json({ error: "Failed to save reflection" });
    }
  });

  // GET /api/whispers - Get current network whispers
  app.get("/api/whispers", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
      
      if (userId) {
        const whispers = await storage.getWhispersWithUserResonance(userId, limit);
        res.json({ whispers });
      } else {
        const whispers = await storage.getNetworkWhispers(limit);
        res.json({ whispers });
      }
    } catch (error) {
      console.error("Whispers fetch error:", error);
      res.status(500).json({ error: "Failed to fetch whispers" });
    }
  });

  // POST /api/whispers/:whisperId/resonate - Toggle resonance on whisper
  app.post("/api/whispers/:whisperId/resonate", async (req, res) => {
    try {
      const whisperId = parseInt(req.params.whisperId);
      const { userId } = req.body;

      if (isNaN(whisperId) || !userId) {
        return res.status(400).json({ error: "Invalid whisper ID or user ID" });
      }

      // Verify user exists and session is valid
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Invalid session" });
      }

      const result = await storage.toggleWhisperResonance(userId, whisperId);
      res.json(result);
    } catch (error) {
      console.error("Resonance toggle error:", error);
      res.status(500).json({ error: "Failed to toggle resonance" });
    }
  });

  // PUT /api/dashboard/mood - Update user's preferred mood
  app.put("/api/dashboard/mood", async (req, res) => {
    try {
      const { userId, mood } = updateMoodSchema.parse(req.body);

      await storage.updateUserMood(userId, mood);
      res.json({ message: "Mood updated" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid mood" });
      }
      console.error("Mood update error:", error);
      res.status(500).json({ error: "Failed to update mood" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
