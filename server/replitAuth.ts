import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  throw new Error(
    "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables are required. " +
    "Create a GitHub OAuth App at https://github.com/settings/developers"
  );
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Derive callback URL: prefer explicit env var, otherwise build from APP_URL
  const callbackURL =
    process.env.GITHUB_CALLBACK_URL ||
    (process.env.APP_URL ? `${process.env.APP_URL}/api/callback` : "/api/callback");

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL,
        scope: ["user:email"],
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const email =
            profile.emails?.find((e: any) => e.primary)?.value ||
            profile.emails?.[0]?.value ||
            null;
          const displayParts = (profile.displayName || profile.username || "").split(" ");
          const user = await storage.upsertUser({
            id: profile.id.toString(),
            email,
            firstName: displayParts[0] || profile.username,
            lastName: displayParts.slice(1).join(" ") || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
          });
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Store only the user ID in the session for minimal session size
  passport.serializeUser((user: any, cb) => cb(null, user.id));
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await storage.getUser(id);
      cb(null, user ?? null);
    } catch (error) {
      cb(error);
    }
  });

  app.get("/api/login", passport.authenticate("github", { scope: ["user:email"] }));

  app.get(
    "/api/callback",
    passport.authenticate("github", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
