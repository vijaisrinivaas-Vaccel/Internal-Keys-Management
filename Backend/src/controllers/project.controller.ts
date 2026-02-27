import { Request, Response } from "express";
import { Project } from "../models/Project.model";
import { ConfigEntry } from "../models/ConfigEntry.model";
import mongoose from "mongoose";

/* ================= CREATE PROJECT ================= */
export const createProject = async (req: Request, res: Response) => {
  try {
    const { title, description, url } = req.body;
    const user = (req as any).user;

    if (!title) {
      return res.status(400).json({ message: "Project title required" });
    }

    const project = await Project.create({
      title,
      description,
      url,
      createdBy: user.id,
      createdByName: user.username || "Unknown",
    });

    return res.status(201).json(project);
  } catch (err) {
    console.error("CREATE PROJECT ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL PROJECTS (MAIN PAGE) ================= */
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 }) // newest first (optional)
      .lean();

    return res.json(projects);
  } catch (err) {
    console.error("GET ALL PROJECTS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET PROJECTS for module ================= */
export const getProjectsForModule = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.query; // 🔥 important

    if (!moduleId) {
      return res.status(400).json({ message: "moduleId required" });
    }

    // 1️⃣ Get all projects
    const projects = await Project.find().lean();

    // 2️⃣ Aggregate key counts grouped by projectId
    const keyCounts = await ConfigEntry.aggregate([
      {
        $match: {
          moduleId: new mongoose.Types.ObjectId(moduleId as string),
        },
      },
      { $unwind: "$entries" },
      {
        $group: {
          _id: "$projectId",
          totalKeys: { $sum: 1 },
        },
      },
    ]);

    // 3️⃣ Convert aggregation result to map for fast lookup
    const keyCountMap = new Map(
      keyCounts.map((item) => [
        item._id.toString(),
        item.totalKeys,
      ])
    );

    // 4️⃣ Attach key count to each project
    const projectsWithKeyCount = projects.map((project) => ({
      ...project,
      totalKeys: keyCountMap.get(project._id.toString()) || 0,
    }));

    return res.json(projectsWithKeyCount);
  } catch (err) {
    console.error("GET PROJECTS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE PROJECT ================= */
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;

    const updateData: any = {
      title,
      description,
    };

    if (req.file) {
      updateData.UploadedFile = req.file.path;
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

/* ================= DELETE PROJECT ================= */
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};