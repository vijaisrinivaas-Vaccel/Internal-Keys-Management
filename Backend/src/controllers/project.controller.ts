import { Request, Response } from "express";
import { Project } from "../models/Project.model";

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




/* ================= GET PROJECTS ================= */
export const getProjects = async (_req: Request, res: Response) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    return res.json(projects);
  } catch {
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