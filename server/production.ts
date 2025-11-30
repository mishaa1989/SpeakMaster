import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import nodePath from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { pool } from "./db";

const app = express();

// Initialize database tables on startup
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS test_sets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        instructor_email TEXT NOT NULL,
        language TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        test_set_id INTEGER NOT NULL REFERENCES test_sets(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        duration TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        audio_data TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS student_recordings (
        id SERIAL PRIMARY KEY,
        test_set_id INTEGER NOT NULL REFERENCES test_sets(id) ON DELETE CASCADE,
        question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        recording_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        test_set_id INTEGER NOT NULL REFERENCES test_sets(id) ON DELETE CASCADE,
        test_set_name TEXT NOT NULL,
        student_name TEXT NOT NULL,
        language TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
        recording_count INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS submission_recordings (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        recording_index INTEGER NOT NULL,
        recording_data TEXT NOT NULL
      );
    `);
    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database tables:", error);
  } finally {
    client.release();
  }
}

declare module 'express-session' {
  interface SessionData {
    isAdminAuthenticated?: boolean;
  }
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

function serveStatic(expressApp: express.Express) {
  const distPath = nodePath.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  expressApp.use(express.static(distPath));

  expressApp.use("*", (_req, res) => {
    res.sendFile(nodePath.resolve(distPath, "index.html"));
  });
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database tables before starting the server
  await initializeDatabase();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Production only serves static files (no Vite dev server)
  serveStatic(app);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
