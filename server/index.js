// // server/index.js

// import express from 'express'
// import cors from 'cors'
// import multer from 'multer'
// import fs from 'fs'
// import path from 'path'
// import { fileURLToPath } from 'url'
// import crypto from 'crypto'
// import { server } from 'typescript'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname  = path.dirname(__filename)

// const app     = express()
// const PORT    = process.env.PORT || 3001
// const IS_PROD = process.env.NODE_ENV === 'production'

// const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
// const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
// const USER_USERNAME  = process.env.USER_USERNAME  || 'user'
// const USER_PASSWORD  = process.env.USER_PASSWORD  || 'user123'
// const JWT_SECRET     = process.env.JWT_SECRET     || crypto.randomBytes(32).toString('hex')

// if (!process.env.JWT_SECRET)       console.warn('  ⚠️  JWT_SECRET not set — sessions reset on restart!')
// if (ADMIN_PASSWORD === 'admin123') console.warn('  ⚠️  Using default ADMIN_PASSWORD!')
// if (USER_PASSWORD  === 'user123')  console.warn('  ⚠️  Using default USER_PASSWORD!')

// // ── JWT helpers ────────────────────────────────────────────────────────────────
// function b64url(str) {
//   return Buffer.from(str).toString('base64')
//     .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
// }
// function signToken(payload) {
//   const h = b64url(JSON.stringify({ alg:'HS256', typ:'JWT' }))
//   const b = b64url(JSON.stringify(payload))
//   const s = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${b}`).digest('base64')
//     .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
//   return `${h}.${b}.${s}`
// }
// function verifyToken(token) {
//   try {
//     const [h,b,s] = token.split('.')
//     const exp = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${b}`).digest('base64')
//       .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')
//     if (s !== exp) return null
//     const payload = JSON.parse(Buffer.from(b, 'base64').toString())
//     if (payload.exp && Date.now() > payload.exp) return null
//     return payload
//   } catch { return null }
// }

// // ── Auth middleware ────────────────────────────────────────────────────────────
// function requireAuth(req, res, next) {
//   const auth = req.headers['authorization'] || ''
//   const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
//   if (!token) return res.status(401).json({ error: 'Not logged in' })
//   const payload = verifyToken(token)
//   if (!payload) return res.status(401).json({ error: 'Invalid or expired token' })
//   req.authUser = payload
//   next()
// }
// function requireAdmin(req, res, next) {
//   requireAuth(req, res, () => {
//     if (req.authUser.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
//     next()
//   })
// }

// // ── Paths ──────────────────────────────────────────────────────────────────────
// const DATA_DIR      = IS_PROD ? '/tmp/invitation-data' : path.join(__dirname, '..', 'public')
// const TEMPLATES_DIR = path.join(DATA_DIR, 'templates')
// const METADATA_FILE = path.join(DATA_DIR, 'templates.json')
// const DIST_DIR      = path.join(__dirname, '..', 'dist')

// if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true })
// if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, '[]', 'utf-8')

// console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
// console.log('  SDB E - Greetings Server')
// console.log(`  Mode        : ${IS_PROD ? 'production' : 'development'}`)
// console.log(`  Port        : ${PORT}`)
// console.log(`  Dist exists : ${fs.existsSync(DIST_DIR)}`)
// console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// app.use(cors())
// app.use(express.json())
// app.use('/templates', express.static(TEMPLATES_DIR))

// // ── Health ─────────────────────────────────────────────────────────────────────
// app.get('/health', (_req, res) => res.json({
//   status: 'ok', timestamp: new Date().toISOString(),
//   mode: IS_PROD ? 'production' : 'development',
//   port: PORT, dist_exists: fs.existsSync(DIST_DIR),
//   template_count: readMeta().length,
// }))

// // ── Login ──────────────────────────────────────────────────────────────────────
// app.post('/api/login', (req, res) => {
//   const { username, password } = req.body || {}
//   if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
//   let role = null
//   if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) role = 'admin'
//   else if (username === USER_USERNAME && password === USER_PASSWORD) role = 'user'
//   if (!role) { console.warn(`[auth] Failed: "${username}"`); return res.status(401).json({ error: 'Invalid username or password' }) }
//   const token = signToken({ role, username, iat: Date.now(), exp: Date.now() + 86400000 })
//   console.log(`[auth] Login: ${username} (${role})`)
//   res.json({ token, username, role })
// })

// // ── Metadata ───────────────────────────────────────────────────────────────────
// function readMeta() {
//   try { return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8')) }
//   catch { return [] }
// }
// function writeMeta(data) {
//   fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
// }

// // ── Multer — accept up to 4 files (1 per language + default) ──────────────────
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, TEMPLATES_DIR),
//   filename: (_req, file, cb) => {
//     const u = `${Date.now()}-${Math.round(Math.random()*1e9)}`
//     cb(null, u + path.extname(file.originalname))
//   },
// })
// const upload = multer({ storage, limits: { fileSize: 20*1024*1024 } })
// // Fields: image_English, image_Sinhala, image_Tamil (any subset)
// const langFields = upload.fields([
//   { name: 'image_English', maxCount: 1 },
//   { name: 'image_Sinhala', maxCount: 1 },
//   { name: 'image_Tamil',   maxCount: 1 },
// ])

// // ── Templates API ──────────────────────────────────────────────────────────────
// app.get('/api/templates', requireAuth, (_req, res) => res.json(readMeta()))

// app.post('/api/templates', requireAdmin, langFields, (req, res) => {
//   const files = req.files || {}
//   const langs = ['English', 'Sinhala', 'Tamil']

//   const { name, fields } = req.body
//   if (!name) return res.status(400).json({ error: 'Template name required' })

//   let parsedFields = []
//   try { parsedFields = JSON.parse(fields || '[]') }
//   catch { return res.status(400).json({ error: 'Invalid fields JSON' }) }

//   // Parse per-language fields
//   const langFieldsMap = {}
//   for (const lang of langs) {
//     const raw = req.body[`fields_${lang}`]
//     if (raw) {
//       try { langFieldsMap[lang] = JSON.parse(raw) } catch {}
//     }
//   }

//   // Build variants (one pass, no duplicates)
//   const variants = []
//   const seenLangs = new Set()
//   for (const lang of langs) {
//     const f = files[`image_${lang}`]?.[0]
//     if (f && !seenLangs.has(lang)) {
//       seenLangs.add(lang)
//       const variant = { lang, filename: f.filename, imageUrl: `/templates/${f.filename}` }
//       if (langFieldsMap[lang]) variant.fields = langFieldsMap[lang]
//       variants.push(variant)
//     }
//   }

//   if (variants.length === 0) return res.status(400).json({ error: 'At least one image required' })

//   const first = variants[0]
//   const template = {
//     id: `tpl_${Date.now()}`,
//     name,
//     filename: first.filename,
//     imageUrl: first.imageUrl,
//     variants,
//     fields: parsedFields,
//     createdAt: new Date().toISOString(),
//   }

//   const meta = readMeta()
//   meta.push(template)
//   writeMeta(meta)
//   console.log(`[upload] "${name}" — variants: ${variants.map(v => v.lang).join(', ')}`)
//   res.json(template)
// })

// app.put('/api/templates/:id', requireAdmin, langFields, (req, res) => {
//   const meta = readMeta()
//   const idx = meta.findIndex(t => t.id === req.params.id)
//   if (idx === -1) return res.status(404).json({ error: 'Not found' })

//   const { name, fields } = req.body
//   if (name) meta[idx].name = name
//   if (fields) {
//     try { meta[idx].fields = JSON.parse(fields) }
//     catch { return res.status(400).json({ error: 'Invalid fields JSON' }) }
//   }

//   const files = req.files || {}
//   const langs = ['English', 'Sinhala', 'Tamil']
//   if (!meta[idx].variants) meta[idx].variants = []

//   // Dedup existing variants first (fixes any bad historical data)
//   const seenLangs = new Set()
//   meta[idx].variants = meta[idx].variants.filter(v => {
//     if (seenLangs.has(v.lang)) return false
//     seenLangs.add(v.lang)
//     return true
//   })

//   for (const lang of langs) {
//     const f = files[`image_${lang}`]?.[0]
//     const rawFields = req.body[`fields_${lang}`]
//     const existingIdx = meta[idx].variants.findIndex(v => v.lang === lang)

//     if (f) {
//       const newVariant = { lang, filename: f.filename, imageUrl: `/templates/${f.filename}` }
//       if (rawFields) {
//         try { newVariant.fields = JSON.parse(rawFields) } catch {}
//       } else if (existingIdx >= 0 && meta[idx].variants[existingIdx].fields) {
//         newVariant.fields = meta[idx].variants[existingIdx].fields
//       }
//       if (existingIdx >= 0) {
//         const old = path.join(TEMPLATES_DIR, meta[idx].variants[existingIdx].filename)
//         if (fs.existsSync(old)) fs.unlinkSync(old)
//         meta[idx].variants[existingIdx] = newVariant
//       } else {
//         meta[idx].variants.push(newVariant)
//       }
//     } else if (rawFields && existingIdx >= 0) {
//       try { meta[idx].variants[existingIdx].fields = JSON.parse(rawFields) } catch {}
//     }
//   }

//   if (meta[idx].variants.length > 0) {
//     meta[idx].filename = meta[idx].variants[0].filename
//     meta[idx].imageUrl = meta[idx].variants[0].imageUrl
//   }

//   writeMeta(meta)
//   res.json(meta[idx])
// })

// app.delete('/api/templates/:id', requireAdmin, (req, res) => {
//   const meta = readMeta()
//   const idx = meta.findIndex(t => t.id === req.params.id)
//   if (idx === -1) return res.status(404).json({ error: 'Not found' })
//   const tpl = meta[idx]
//   // Delete all variant files
//   const toDelete = [tpl.filename, ...(tpl.variants || []).map(v => v.filename)]
//   const unique = [...new Set(toDelete)]
//   for (const fn of unique) {
//     const fp = path.join(TEMPLATES_DIR, fn)
//     if (fs.existsSync(fp)) fs.unlinkSync(fp)
//   }
//   meta.splice(idx, 1)
//   writeMeta(meta)
//   res.json({ success: true })
// })

// // ── Frontend ───────────────────────────────────────────────────────────────────
// if (IS_PROD && fs.existsSync(DIST_DIR)) {
//   app.use(express.static(DIST_DIR))
//   app.get('*', (_req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')))
// } else if (IS_PROD) {
//   app.get('*', (_req, res) => res.status(503).send(`<h2>Build missing</h2><a href="/health">/health</a>`))
// }

// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`\n✅ Listening on 0.0.0.0:${PORT}`)
//   console.log(`   Health: http://localhost:${PORT}/health\n`)
// })

// server/index.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
// const USER_USERNAME = process.env.USER_USERNAME || "user";
// const USER_PASSWORD = process.env.USER_PASSWORD || "user123";
const JWT_SECRET =
  process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

if (!process.env.JWT_SECRET)
  console.warn("  ⚠️  JWT_SECRET not set — sessions reset on restart!");
if (ADMIN_PASSWORD === "admin123")
  console.warn("  ⚠️  Using default ADMIN_PASSWORD!");
// if (USER_PASSWORD === "user123")
//   console.warn("  ⚠️  Using default USER_PASSWORD!");

// ── JWT helpers ────────────────────────────────────────────────────────────────
function b64url(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
function signToken(payload) {
  const h = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const b = b64url(JSON.stringify(payload));
  const s = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${h}.${b}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${h}.${b}.${s}`;
}
function verifyToken(token) {
  try {
    const [h, b, s] = token.split(".");
    const exp = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${h}.${b}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    if (s !== exp) return null;
    const payload = JSON.parse(Buffer.from(b, "base64").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Password hashing ───────────────────────────────────────────────────────────
function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password + JWT_SECRET)
    .digest("hex");
}

// ── Auth middleware ────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not logged in" });
  const payload = verifyToken(token);
  if (!payload)
    return res.status(401).json({ error: "Invalid or expired token" });
  req.authUser = payload;
  next();
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.authUser.role !== "admin")
      return res.status(403).json({ error: "Admin access required" });
    next();
  });
}

// ── Paths ──────────────────────────────────────────────────────────────────────
// const DATA_DIR = IS_PROD
//   ? "/tmp/invitation-data"
//   : path.join(__dirname, "..", "public");
const DATA_DIR = IS_PROD
  ? (process.env.DATA_DIR || '/data')   // mount your volume at /data
  : path.join(__dirname, '..', 'public')
const TEMPLATES_DIR = path.join(DATA_DIR, "templates");
const METADATA_FILE = path.join(DATA_DIR, "templates.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");
const DIST_DIR = path.join(__dirname, "..", "dist");

if (!fs.existsSync(TEMPLATES_DIR))
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
if (!fs.existsSync(METADATA_FILE))
  fs.writeFileSync(METADATA_FILE, "[]", "utf-8");
if (!fs.existsSync(ACTIVITY_FILE))
  fs.writeFileSync(ACTIVITY_FILE, "[]", "utf-8");

// ── Users store ────────────────────────────────────────────────────────────────
function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}
function writeUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Seed default users if file doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  writeUsers([
    {
      id: "usr_admin",
      username: ADMIN_USERNAME,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: "admin",
      createdAt: new Date().toISOString(),
      createdBy: "system",
    },
    // {
    //   id: "usr_default",
    //   username: USER_USERNAME,
    //   passwordHash: hashPassword(USER_PASSWORD),
    //   role: "user",
    //   createdAt: new Date().toISOString(),
    //   createdBy: "system",
    // },
  ]);
}

// ── Activity store ─────────────────────────────────────────────────────────────
function readActivity() {
  try {
    return JSON.parse(fs.readFileSync(ACTIVITY_FILE, "utf-8"));
  } catch {
    return [];
  }
}
function appendActivity(entry) {
  const activities = readActivity();
  activities.push({
    ...entry,
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  });
  // Keep last 10,000 entries to prevent unbounded growth
  const trimmed = activities.slice(-10000);
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SDB E - Greetings Server");
console.log(`  Mode        : ${IS_PROD ? "production" : "development"}`);
console.log(`  Port        : ${PORT}`);
console.log(`  Dist exists : ${fs.existsSync(DIST_DIR)}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

app.use(cors());
app.use(express.json());
app.use("/templates", express.static(TEMPLATES_DIR));

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mode: IS_PROD ? "production" : "development",
    port: PORT,
    dist_exists: fs.existsSync(DIST_DIR),
    template_count: readMeta().length,
    user_count: readUsers().length,
  }),
);

// ── Login ──────────────────────────────────────────────────────────────────────
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  const users = readUsers();
  const user = users.find(
    (u) => u.username === username && u.passwordHash === hashPassword(password),
  );

  if (!user) {
    // Log failed login attempt
    appendActivity({
      type: "login_failed",
      username,
      timestamp: new Date().toISOString(),
      ip: req.ip,
    });
    console.warn(`[auth] Failed: "${username}"`);
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = signToken({
    role: user.role,
    username: user.username,
    userId: user.id,
    iat: Date.now(),
    exp: Date.now() + 86400000,
  });

  // Log successful login
  appendActivity({
    type: "login",
    username: user.username,
    userId: user.id,
    role: user.role,
    timestamp: new Date().toISOString(),
    ip: req.ip,
  });

  console.log(`[auth] Login: ${user.username} (${user.role})`);
  res.json({ token, username: user.username, role: user.role });
});

// ── Activity tracking ──────────────────────────────────────────────────────────
app.post("/api/track", requireAuth, (req, res) => {
  const { type, ...rest } = req.body || {};
  if (!type) return res.status(400).json({ error: "type required" });

  appendActivity({
    type,
    username: req.authUser.username,
    userId: req.authUser.userId,
    role: req.authUser.role,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    ...rest,
  });

  res.json({ ok: true });
});

// ── Stats ──────────────────────────────────────────────────────────────────────
app.get("/api/stats", requireAdmin, (_req, res) => {
  const activity = readActivity();
  const users = readUsers();

  // Per-user aggregates
  const userStats = {};
  for (const u of users) {
    userStats[u.username] = {
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
      loginCount: 0,
      downloadCount: 0,
      lastLogin: null,
      lastActivity: null,
      languages: {},
      templates: {},
    };
  }

  const downloads = [];
  const logins = [];
  const dailyDownloads = {};
  const languageTotals = {};
  const templateTotals = {};

  for (const a of activity) {
    const uname = a.username || "unknown";

    // Ensure slot exists for users not in users.json (edge case)
    if (!userStats[uname]) {
      userStats[uname] = {
        username: uname,
        role: a.role || "user",
        createdAt: null,
        loginCount: 0,
        downloadCount: 0,
        lastLogin: null,
        lastActivity: null,
        languages: {},
        templates: {},
      };
    }

    if (
      a.timestamp &&
      (!userStats[uname].lastActivity ||
        a.timestamp > userStats[uname].lastActivity)
    ) {
      userStats[uname].lastActivity = a.timestamp;
    }

    if (a.type === "login") {
      userStats[uname].loginCount++;
      if (
        !userStats[uname].lastLogin ||
        a.timestamp > userStats[uname].lastLogin
      ) {
        userStats[uname].lastLogin = a.timestamp;
      }
      logins.push(a);
    }

    if (a.type === "download") {
      userStats[uname].downloadCount++;
      downloads.push(a);

      // Language breakdown per user
      if (a.language) {
        userStats[uname].languages[a.language] =
          (userStats[uname].languages[a.language] || 0) + 1;
        languageTotals[a.language] = (languageTotals[a.language] || 0) + 1;
      }

      // Template breakdown per user
      if (a.templateName) {
        userStats[uname].templates[a.templateName] =
          (userStats[uname].templates[a.templateName] || 0) + 1;
        templateTotals[a.templateName] =
          (templateTotals[a.templateName] || 0) + 1;
      }

      // Daily breakdown
      const day = a.timestamp ? a.timestamp.slice(0, 10) : "unknown";
      dailyDownloads[day] = (dailyDownloads[day] || 0) + 1;
    }
  }

  // Recent activity (last 100 events, newest first)
  const recentActivity = [...activity].reverse().slice(0, 100);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  res.json({
    summary: {
      totalUsers: users.length,
      totalLogins: logins.length,
      totalDownloads: downloads.length,
      // activeUsers: Object.values(userStats).filter(u => u.downloadCount > 0 || u.loginCount > 0).length,
      activeUsers: Object.values(userStats).filter(
        (u) =>
          (u.lastLogin && new Date(u.lastLogin).getTime() > thirtyDaysAgo) ||
          (u.lastActivity &&
            new Date(u.lastActivity).getTime() > thirtyDaysAgo),
      ).length,
    },
    userStats: Object.values(userStats),
    languageTotals,
    templateTotals,
    dailyDownloads,
    recentActivity,
  });
});

// ── Users API (admin only) ─────────────────────────────────────────────────────
app.get("/api/users", requireAdmin, (_req, res) => {
  const users = readUsers().map(({ passwordHash, ...rest }) => rest); // strip hash
  res.json(users);
});

app.post("/api/users", requireAdmin, (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  if (!["admin", "user"].includes(role))
    return res.status(400).json({ error: "Role must be admin or user" });

  const users = readUsers();
  if (users.find((u) => u.username === username)) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    username: username.trim(),
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
    createdBy: req.authUser.username,
  };

  users.push(newUser);
  writeUsers(users);
  console.log(
    `[users] Created: ${username} (${role}) by ${req.authUser.username}`,
  );

  const { passwordHash, ...safe } = newUser;
  res.json(safe);
});

app.put("/api/users/:id", requireAdmin, (req, res) => {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  // Prevent editing the primary admin account's username/role via API
  if (
    users[idx].id === "usr_admin" &&
    (req.body.role === "user" || req.body.username)
  ) {
    // Allow password change only for default admin
    if (req.body.username || req.body.role) {
      return res.status(403).json({
        error: "Cannot change username or role of the default admin account",
      });
    }
  }

  const { username, password, role } = req.body || {};

  if (username) {
    const conflict = users.find(
      (u) => u.username === username && u.id !== req.params.id,
    );
    if (conflict)
      return res.status(409).json({ error: "Username already exists" });
    users[idx].username = username.trim();
  }
  if (password) users[idx].passwordHash = hashPassword(password);
  if (role && ["admin", "user"].includes(role)) users[idx].role = role;

  writeUsers(users);
  const { passwordHash, ...safe } = users[idx];
  res.json(safe);
});

app.delete("/api/users/:id", requireAdmin, (req, res) => {
  // Prevent deleting self or default admin
  const users = readUsers();
  const target = users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === "usr_admin")
    return res
      .status(403)
      .json({ error: "Cannot delete the default admin account" });
  if (target.username === req.authUser.username)
    return res.status(403).json({ error: "Cannot delete your own account" });

  const filtered = users.filter((u) => u.id !== req.params.id);
  writeUsers(filtered);
  console.log(
    `[users] Deleted: ${target.username} by ${req.authUser.username}`,
  );
  res.json({ success: true });
});

// ── Metadata ───────────────────────────────────────────────────────────────────
function readMeta() {
  try {
    return JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}
function writeMeta(data) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ── Multer ─────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMPLATES_DIR),
  filename: (_req, file, cb) => {
    const u = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, u + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
const langFields = upload.fields([
  { name: "image_English", maxCount: 1 },
  { name: "image_Sinhala", maxCount: 1 },
  { name: "image_Tamil", maxCount: 1 },
]);

// ── Templates API ──────────────────────────────────────────────────────────────
app.get("/api/templates", requireAuth, (_req, res) => res.json(readMeta()));

app.post("/api/templates", requireAdmin, langFields, (req, res) => {
  const files = req.files || {};
  const langs = ["English", "Sinhala", "Tamil"];

  const { name, fields } = req.body;
  if (!name) return res.status(400).json({ error: "Template name required" });

  let parsedFields = [];
  try {
    parsedFields = JSON.parse(fields || "[]");
  } catch {
    return res.status(400).json({ error: "Invalid fields JSON" });
  }

  const langFieldsMap = {};
  for (const lang of langs) {
    const raw = req.body[`fields_${lang}`];
    if (raw) {
      try {
        langFieldsMap[lang] = JSON.parse(raw);
      } catch {}
    }
  }

  const variants = [];
  const seenLangs = new Set();
  for (const lang of langs) {
    const f = files[`image_${lang}`]?.[0];
    if (f && !seenLangs.has(lang)) {
      seenLangs.add(lang);
      const variant = {
        lang,
        filename: f.filename,
        imageUrl: `/templates/${f.filename}`,
      };
      if (langFieldsMap[lang]) variant.fields = langFieldsMap[lang];
      variants.push(variant);
    }
  }

  if (variants.length === 0)
    return res.status(400).json({ error: "At least one image required" });

  const first = variants[0];
  const template = {
    id: `tpl_${Date.now()}`,
    name,
    filename: first.filename,
    imageUrl: first.imageUrl,
    variants,
    fields: parsedFields,
    createdAt: new Date().toISOString(),
  };

  const meta = readMeta();
  meta.push(template);
  writeMeta(meta);
  console.log(
    `[upload] "${name}" — variants: ${variants.map((v) => v.lang).join(", ")}`,
  );
  res.json(template);
});

app.put("/api/templates/:id", requireAdmin, langFields, (req, res) => {
  const meta = readMeta();
  const idx = meta.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const { name, fields } = req.body;
  if (name) meta[idx].name = name;
  if (fields) {
    try {
      meta[idx].fields = JSON.parse(fields);
    } catch {
      return res.status(400).json({ error: "Invalid fields JSON" });
    }
  }

  const files = req.files || {};
  const langs = ["English", "Sinhala", "Tamil"];
  if (!meta[idx].variants) meta[idx].variants = [];

  const seenLangs = new Set();
  meta[idx].variants = meta[idx].variants.filter((v) => {
    if (seenLangs.has(v.lang)) return false;
    seenLangs.add(v.lang);
    return true;
  });

  for (const lang of langs) {
    const f = files[`image_${lang}`]?.[0];
    const rawFields = req.body[`fields_${lang}`];
    const existingIdx = meta[idx].variants.findIndex((v) => v.lang === lang);

    if (f) {
      const newVariant = {
        lang,
        filename: f.filename,
        imageUrl: `/templates/${f.filename}`,
      };
      if (rawFields) {
        try {
          newVariant.fields = JSON.parse(rawFields);
        } catch {}
      } else if (existingIdx >= 0 && meta[idx].variants[existingIdx].fields) {
        newVariant.fields = meta[idx].variants[existingIdx].fields;
      }
      if (existingIdx >= 0) {
        const old = path.join(
          TEMPLATES_DIR,
          meta[idx].variants[existingIdx].filename,
        );
        if (fs.existsSync(old)) fs.unlinkSync(old);
        meta[idx].variants[existingIdx] = newVariant;
      } else {
        meta[idx].variants.push(newVariant);
      }
    } else if (rawFields && existingIdx >= 0) {
      try {
        meta[idx].variants[existingIdx].fields = JSON.parse(rawFields);
      } catch {}
    }
  }

  if (meta[idx].variants.length > 0) {
    meta[idx].filename = meta[idx].variants[0].filename;
    meta[idx].imageUrl = meta[idx].variants[0].imageUrl;
  }

  writeMeta(meta);
  res.json(meta[idx]);
});

app.delete("/api/templates/:id", requireAdmin, (req, res) => {
  const meta = readMeta();
  const idx = meta.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const tpl = meta[idx];
  const toDelete = [
    tpl.filename,
    ...(tpl.variants || []).map((v) => v.filename),
  ];
  const unique = [...new Set(toDelete)];
  for (const fn of unique) {
    const fp = path.join(TEMPLATES_DIR, fn);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  meta.splice(idx, 1);
  writeMeta(meta);
  res.json({ success: true });
});

// ── Frontend ───────────────────────────────────────────────────────────────────
if (IS_PROD && fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (_req, res) => res.sendFile(path.join(DIST_DIR, "index.html")));
} else if (IS_PROD) {
  app.get("*", (_req, res) =>
    res.status(503).send(`<h2>Build missing</h2><a href="/health">/health</a>`),
  );
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅ Listening on 0.0.0.0:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
