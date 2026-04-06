import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./replitAuth";

const app = express();

// Set Express env to match NODE_ENV
app.set("env", process.env.NODE_ENV || "development");

// Stripe webhook must be registered BEFORE express.json() to access raw body
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Import here to avoid circular dependencies
  const { handleStripeWebhook } = await import('./routes');
  await handleStripeWebhook(req, res);
});

app.use(express.json());
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
  try {
    // Log environment on startup to help diagnose missing env vars
    log(`Starting in ${app.get("env")} mode`);
    log(`DATABASE_URL: ${process.env.DATABASE_URL ? "set" : "MISSING"}`);
    log(`SESSION_SECRET: ${process.env.SESSION_SECRET ? "set" : "MISSING"}`);
    log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "set" : "MISSING"}`);
    log(`STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? "set" : "MISSING"}`);

    // Setup authentication before routes
    await setupAuth(app);

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    // Only setup vite in development; serve static build in production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (err) {
    console.error("FATAL: Failed to start server:", err);
    process.exit(1);
  }
})();
