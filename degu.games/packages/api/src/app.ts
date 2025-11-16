import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import routes from "./routes";

const createApp = (): Application => {
  const app = express();

  app.use(helmet());

  // CORS configuration - allow specific origins with credentials
  // Get allowed origins from environment variable or use defaults
  const defaultOrigins = [
    'http://localhost:3001',  // Web app
    'http://localhost:8601',  // Scratch GUI
    'http://localhost:8602',  // Alternative Scratch port
  ];

  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : defaultOrigins;

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,  // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(morgan("combined"));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Serve static files for default profile images
  app.use("/default-images", express.static(path.join(__dirname, "../public/default-images")));

  app.use("/api/v1", routes);

  return app;
};

export default createApp;
