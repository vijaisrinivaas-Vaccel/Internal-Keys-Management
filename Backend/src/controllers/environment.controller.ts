import { Request, Response } from "express";
import { Environment } from "../models/Environment.model";

/* CREATE ENVIRONMENT */
export const createEnvironment = async (req: Request, res: Response) => {
  try {
    const { name, projectId } = req.body;
    const user = (req as any).user;

    if (!name || !projectId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await Environment.findOne({ name, projectId });
    if (exists) {
      return res.status(400).json({ message: "Environment already exists" });
    }

    const env = await Environment.create({
      name,
      projectId,
      createdBy: user.id,
      createdByName: user.username,
    });

    res.status(201).json(env);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* GET ENVIRONMENTS BY PROJECT */
export const getEnvironments = async (req: Request, res: Response) => {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ message: "projectId required" });
  }

  const envs = await Environment.find({ projectId }).sort({ createdAt: 1 });
  res.json(envs);
};

