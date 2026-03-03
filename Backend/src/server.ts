import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";

import projectRoutes from "./routes/project.routes";
import environmentRoutes from "./routes/environment.routes"
import moduleRoutes from "./routes/module.routes";
import configRoutes from "./routes/configEntry.routes";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isConfigured = allowedOrigins.includes(origin);
      const isLocalDev = /^http:\/\/localhost:\d+$/.test(origin);

      if (isConfigured || isLocalDev) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/environments", environmentRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/config", configRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("Project Key Management Backend Running 🚀");
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
