// Dev-only middleware: gives the browser a tiny API to read/write a REAL
// users.json file on disk while `npm run dev` is running.
// This works because vite.config.js runs in Node.js (not the browser),
// so it has real filesystem access — unlike the React app itself.
//
// GET  /api/users        -> returns the contents of data/users.json
// POST /api/users        -> overwrites data/users.json with the request body
//
// Add this to your vite.config.js (see instructions in README).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, "..", "data", "users.json");

export function jsonUsersApiPlugin() {
  return {
    name: "json-users-api",
    configureServer(server) {
      server.middlewares.use("/api/users", (req, res) => {
        if (req.method === "GET") {
          try {
            const raw = fs.existsSync(DATA_FILE)
              ? fs.readFileSync(DATA_FILE, "utf-8")
              : "[]";
            res.setHeader("Content-Type", "application/json");
            res.end(raw);
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", () => {
            try {
              // Validate it's real JSON before writing
              const parsed = JSON.parse(body);
              fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2));
              console.log(`[json-users-api] wrote ${parsed.length} users to ${DATA_FILE}`);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              console.error("[json-users-api] write failed:", err);
              res.statusCode = 400;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end("Method not allowed");
      });
    },
  };
}
