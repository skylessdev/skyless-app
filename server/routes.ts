import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { connectWalletSchema, signupEmailSchema, type ConnectWalletRequest, type SignupEmailRequest } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Connect wallet endpoint
  app.post("/api/connect-wallet", async (req, res) => {
    try {
      const { walletAddress }: ConnectWalletRequest = connectWalletSchema.parse(req.body);
      
      // Check if wallet already exists
      const existingUser = await storage.getUserByWallet(walletAddress);
      if (existingUser) {
        return res.json({ user: existingUser, message: "Wallet already connected" });
      }

      // Create new user
      const user = await storage.createUser({
        walletAddress,
        connectionType: "wallet",
        email: null,
      });

      res.json({ user, message: "Wallet connected successfully" });
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
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.json({ user: existingUser, message: "Email already registered" });
      }

      // Create new user
      const user = await storage.createUser({
        email,
        connectionType: "email",
        walletAddress: null,
      });

      res.json({ user, message: "Email registered successfully" });
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
      const user = await storage.createUser({
        connectionType: "anonymous",
        email: null,
        walletAddress: null,
      });

      res.json({ user, message: "Anonymous session created" });
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

  const httpServer = createServer(app);
  return httpServer;
}
