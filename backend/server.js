

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const connectDB = require("./db");
const Incident = require("./models/Incident");
const Authority = require("./models/Authority");
const Admin = require("./models/Admin");
const Citizen = require("./models/Citizen");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 5000;

// Render jaise hosting par asli user ka IP sahi padhne ke liye (rate limit ke kaam aata hai)
app.set("trust proxy", 1);

// CORS: .env mein FRONTEND_URL ho to sirf wahi allowed, warna sab (local ke liye)
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json({ limit: "20mb" }));

// Sirf POST / PATCH / DELETE log hote hain (GET polling ka shor nahi)
app.use((req, res, next) => {
  if (req.method !== "GET") {
    console.log(
      `${new Date().toLocaleTimeString()}  ${req.method}  ${req.originalUrl}`
    );
  }
  next();
});

// Duplicate submit se bachne ke liye (same report 15 second me dobara aaye to ignore)
const recentSubmissions = new Map();

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "missing-key",
  baseURL: "https://api.groq.com/openai/v1",
});

// JWT token banane wala helper (1 din baad expire)
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

// AUTH MIDDLEWARE: token check karta hai, aur roles ki list se role match karta hai
// Use: requireAuth("admin")  ya  requireAuth("authority", "admin")
const requireAuth =
  (...roles) =>
  (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Login required.",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to do this.",
        });
      }

      req.auth = decoded;
      next();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid. Please log in again.",
      });
    }
  };

// LOGIN RATE LIMIT (#29): 10 galat attempts ke baad 15 minute ka lock
const LOGIN_MAX_FAILS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map();

const loginLimiter = (req, res, next) => {
  const key = `${req.ip}|${req.path}`;
  const entry = loginAttempts.get(key);

  if (entry && entry.resetAt > Date.now() && entry.fails >= LOGIN_MAX_FAILS) {
    const minutes = Math.ceil((entry.resetAt - Date.now()) / 60000);

    return res.status(429).json({
      success: false,
      message: `Too many failed attempts. Try again in ${minutes} minute(s).`,
    });
  }

  res.on("finish", () => {
    const current = loginAttempts.get(key);

    if (res.statusCode === 401) {
      if (!current || current.resetAt <= Date.now()) {
        loginAttempts.set(key, {
          fails: 1,
          resetAt: Date.now() + LOGIN_WINDOW_MS,
        });
      } else {
        current.fails += 1;
      }
    } else if (res.statusCode < 400) {
      loginAttempts.delete(key); // sahi login par counter reset
    }
  });

  next();
};

// Purani entries saaf karne ke liye (memory na bhare)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts) {
    if (entry.resetAt <= now) loginAttempts.delete(key);
  }
}, 10 * 60 * 1000).unref();

const normalize = (value) => String(value ?? "").trim().toLowerCase();

const normalizeStatus = (value) => normalize(value).replace(/[\s_]+/g, "-");

// MongoDB ID 24 hex characters ki hoti hai (#30)
const isValidId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const sendInvalidId = (res) =>
  res.status(400).json({ success: false, message: "Invalid ID." });

const parseCoordinate = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const getCitizenFilter = (query) => {
  const userId = String(query.userId || "").trim();
  const email = normalize(query.email);
  const username = normalize(query.username);
  const conditions = [];

  if (userId) conditions.push({ "citizen.userId": userId });
  if (email) conditions.push({ "citizen.email": email });
  if (username) conditions.push({ "citizen.username": username });

  return conditions.length ? { $or: conditions } : null;
};

const getRequestFilter = (query) =>
  query.scope !== "citizen" ? {} : getCitizenFilter(query);

// Incident list photo ke bina (#24): bhaari base64 image list ke saath nahi aati.
// Photo ke bajay hasImage true/false aata hai, photo ek incident kholne par milti hai.
const findIncidentsLite = (filter) =>
  Incident.aggregate([
    { $match: filter || {} },
    { $sort: { createdAt: -1 } },
    {
      $addFields: {
        hasImage: {
          $gt: [{ $strLenCP: { $ifNull: ["$image", ""] } }, 0],
        },
      },
    },
    { $project: { image: 0 } },
  ]);

// Incident list/stats ka filter:
// citizen ko hamesha sirf apni reports (token se pehchaan), admin/authority ko sab
const buildIncidentFilter = async (req) => {
  if (req.auth.role === "citizen") {
    const me = await Citizen.findById(req.auth.id).lean();

    if (!me) {
      return {
        error: {
          status: 401,
          message: "Account not found. Please log in again.",
        },
      };
    }

    return {
      filter: getCitizenFilter({
        userId: me.userId,
        email: me.email,
        username: me.username,
      }),
    };
  }

  const filter = getRequestFilter(req.query);

  if (req.query.scope === "citizen" && !filter) {
    return {
      error: {
        status: 400,
        message: "Citizen userId, email or username is required.",
      },
    };
  }

  return { filter };
};

const isHighPriority = (incident) =>
  ["high", "critical"].includes(normalize(incident.aiAssessment?.severity)) ||
  ["high", "critical"].includes(normalize(incident.severity));

const sendServerError = (res, error, label, message) => {
  console.error(`${label}:`, error);
  return res.status(500).json({ success: false, message });
};

const safeCitizen = (citizen) => ({
  userId: String(citizen.userId || citizen._id || ""),
  _id: citizen._id,
  fullName: citizen.fullName || "",
  username: citizen.username || "",
  email: citizen.email || "",
});

// Password check: bcrypt hash ya purana plain-text dono support karta hai
const isHashed = (value) => /^\$2[aby]\$/.test(String(value || ""));

const verifyPassword = async (plain, stored) => {
  if (!stored) return false;
  if (isHashed(stored)) return bcrypt.compare(plain, stored);
  return stored === plain; // purane accounts (plain text)
};

// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("SmartTraffic Backend Running");
});

// ==================================================
// PUBLIC ROUTES (login / register)
// ==================================================

// CITIZEN REGISTRATION
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body || {};

    if (
      !String(fullName || "").trim() ||
      !String(username || "").trim() ||
      !String(email || "").trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedUsername = normalize(username);
    const normalizedEmail = normalize(email);

    const existing = await Citizen.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists. Please log in.",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const citizen = await Citizen.create({
      fullName: String(fullName).trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: safeCitizen(citizen),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists.",
      });
    }
    return sendServerError(
      res,
      error,
      "CITIZEN REGISTER ERROR",
      "Unable to create account."
    );
  }
});

// CITIZEN LOGIN
app.post("/api/auth/login", loginLimiter, async (req, res) => {
  try {
    const username = normalize(req.body?.username);
    const password = String(req.body?.password || "");

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    const citizen = await Citizen.findOne({ username });

    const ok = citizen ? await verifyPassword(password, citizen.password) : false;

    if (!citizen || !ok) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // Purana plain-text password mila to login ke time hash me convert kar do
    if (!isHashed(citizen.password)) {
      const newHash = await bcrypt.hash(password, 10);
      await Citizen.updateOne({ _id: citizen._id }, { $set: { password: newHash } });
    }

    const token = signToken({
      id: String(citizen._id),
      role: "citizen",
    });

    return res.json({
      success: true,
      message: "Login successful.",
      user: safeCitizen(citizen),
      token,
    });
  } catch (error) {
    return sendServerError(res, error, "CITIZEN LOGIN ERROR", "Unable to log in.");
  }
});

// AUTHORITY LOGIN
app.post("/api/authority/login", loginLimiter, async (req, res) => {
  try {
    const { officerId, password } = req.body || {};

    if (!officerId || !password) {
      return res.status(400).json({
        success: false,
        message: "Officer ID and password are required.",
      });
    }

    const authority = await Authority.findOne({
      officerId: String(officerId).trim(),
    });

    if (
      !authority ||
      !(await verifyPassword(String(password), authority.password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid officer ID or password.",
      });
    }

    if (authority.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This authority account is inactive.",
      });
    }

    const safeAuthority = authority.toObject();
    delete safeAuthority.password;

    const token = signToken({
      id: String(authority._id),
      role: "authority",
    });

    return res.json({
      success: true,
      message: "Authority login successful.",
      authority: safeAuthority,
      token,
    });
  } catch (error) {
    return sendServerError(res, error, "AUTHORITY LOGIN ERROR", "Unable to log in.");
  }
});

// ADMIN LOGIN
app.post("/api/admin/login", loginLimiter, async (req, res) => {
  try {
    const { adminId, password } = req.body || {};

    if (!adminId || !password) {
      return res.status(400).json({
        success: false,
        message: "Admin ID and password are required.",
      });
    }

    const admin = await Admin.findOne({ adminId: String(adminId).trim() });

    if (!admin || !(await verifyPassword(String(password), admin.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin ID or password.",
      });
    }

    if (admin.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This admin account is inactive.",
      });
    }

    const safeAdmin = admin.toObject();
    delete safeAdmin.password;

    const token = signToken({
      id: String(admin._id),
      role: "admin",
    });

    return res.json({
      success: true,
      message: "Admin login successful.",
      admin: safeAdmin,
      token,
    });
  } catch (error) {
    return sendServerError(res, error, "ADMIN LOGIN ERROR", "Unable to log in.");
  }
});

// ==================================================
// PROTECTED ROUTES
// ==================================================

// CHECK USER STILL EXISTS (sirf citizen, aur sirf apna account)
app.get("/api/auth/me/:userId", requireAuth("citizen"), async (req, res) => {
  try {
    const id = String(req.params.userId || "").trim();
    const citizen = await Citizen.findOne({ userId: id });

    if (!citizen) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (String(citizen._id) !== req.auth.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to do this.",
      });
    }

    return res.json({ success: true, user: safeCitizen(citizen) });
  } catch (error) {
    return sendServerError(res, error, "AUTH ME ERROR", "Unable to fetch user.");
  }
});

// GET ALL INCIDENTS (citizen: sirf apni, authority/admin: sab) - photo ke bina
app.get(
  "/api/incidents",
  requireAuth("citizen", "authority", "admin"),
  async (req, res) => {
    try {
      const { filter, error } = await buildIncidentFilter(req);

      if (error) {
        return res
          .status(error.status)
          .json({ success: false, message: error.message });
      }

      const incidents = await findIncidentsLite(filter);

      return res.json({ success: true, incidents });
    } catch (error) {
      return sendServerError(res, error, "GET INCIDENTS ERROR", "Unable to fetch incidents.");
    }
  }
);

// INCIDENT STATISTICS
app.get(
  "/api/incidents/stats",
  requireAuth("citizen", "authority", "admin"),
  async (req, res) => {
    try {
      const { filter, error } = await buildIncidentFilter(req);

      if (error) {
        return res
          .status(error.status)
          .json({ success: false, message: error.message });
      }

      const incidents = await Incident.find(filter)
        .select("status severity aiAssessment")
        .lean();

      const stats = {
        totalReports: incidents.length,
        pending: 0,
        responding: 0,
        resolved: 0,
      };

      incidents.forEach((incident) => {
        const status = normalizeStatus(incident.status);

        if (["reported", "pending", "acknowledged"].includes(status)) {
          stats.pending++;
        } else if (["responding", "in-progress"].includes(status)) {
          stats.responding++;
        } else if (status === "resolved") {
          stats.resolved++;
        }
      });

      return res.json({ success: true, stats });
    } catch (error) {
      return sendServerError(
        res,
        error,
        "INCIDENT STATS ERROR",
        "Unable to fetch incident statistics."
      );
    }
  }
);

// GET ONE INCIDENT (photo ke saath; citizen sirf apni report dekh sakta hai)
app.get(
  "/api/incidents/:id",
  requireAuth("citizen", "authority", "admin"),
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) return sendInvalidId(res);

      const incident = await Incident.findById(req.params.id).lean();

      if (!incident) {
        return res.status(404).json({ success: false, message: "Incident not found." });
      }

      if (req.auth.role === "citizen") {
        const me = await Citizen.findById(req.auth.id).lean();
        const ic = incident.citizen || {};

        const isOwner =
          me &&
          ((ic.userId && String(ic.userId) === String(me.userId)) ||
            (ic.email && normalize(ic.email) === normalize(me.email)) ||
            (ic.username && normalize(ic.username) === normalize(me.username)));

        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: "You do not have permission to do this.",
          });
        }
      }

      return res.json({ success: true, incident });
    } catch (error) {
      return sendServerError(res, error, "GET INCIDENT ERROR", "Unable to fetch incident.");
    }
  }
);

// UPDATE INCIDENT STATUS (sirf authority ya admin)
app.patch(
  "/api/incidents/:id/status",
  requireAuth("authority", "admin"),
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) return sendInvalidId(res);

      const allowedStatuses = [
        "reported",
        "pending",
        "acknowledged",
        "responding",
        "in-progress",
        "resolved",
      ];

      const status = normalizeStatus(req.body?.status);

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid incident status." });
      }

      const updates = { status };

      if (req.body.assignedTeam !== undefined) {
        updates.assignedTeam = String(req.body.assignedTeam).trim();
      }

      if (req.body.resolutionNote !== undefined) {
        updates.resolutionNote = String(req.body.resolutionNote).trim();
      }

      const incident = await Incident.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-image");

      if (!incident) {
        return res.status(404).json({ success: false, message: "Incident not found." });
      }

      return res.json({
        success: true,
        message: "Incident status updated successfully.",
        incident,
      });
    } catch (error) {
      return sendServerError(res, error, "UPDATE STATUS ERROR", "Unable to update incident status.");
    }
  }
);

// ADMIN DASHBOARD STATS
app.get("/api/admin/stats", requireAuth("admin"), async (req, res) => {
  try {
    const [totalIncidents, activeAuthorities, totalCitizens, incidents] =
      await Promise.all([
        Incident.countDocuments(),
        Authority.countDocuments({ isActive: { $ne: false } }),
        Citizen.countDocuments(),
        Incident.find().select("-image").lean(),
      ]);

    const pending = incidents.filter((incident) =>
      ["reported", "pending", "acknowledged"].includes(
        normalizeStatus(incident.status)
      )
    ).length;

    const resolved = incidents.filter(
      (incident) => normalizeStatus(incident.status) === "resolved"
    ).length;

    const highPriority = incidents.filter(isHighPriority).length;

    return res.json({
      success: true,
      stats: {
        totalIncidents,
        activeAuthorities,
        totalCitizens,
        pending,
        highPriority,
        resolved,
      },
    });
  } catch (error) {
    return sendServerError(res, error, "ADMIN STATS ERROR", "Unable to fetch admin statistics.");
  }
});

// ADMIN: LIST AUTHORITIES
app.get("/api/admin/authorities", requireAuth("admin"), async (req, res) => {
  try {
    const authorities = await Authority.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, authorities });
  } catch (error) {
    return sendServerError(res, error, "GET AUTHORITIES ERROR", "Unable to fetch authorities.");
  }
});

// ADMIN: CREATE AUTHORITY
app.post("/api/admin/authorities", requireAuth("admin"), async (req, res) => {
  try {
    const { officerId, password } = req.body || {};

    if (!officerId || !password) {
      return res.status(400).json({
        success: false,
        message: "Officer ID and password are required.",
      });
    }

    const normalizedOfficerId = String(officerId).trim();

    const existing = await Authority.findOne({ officerId: normalizedOfficerId });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Officer ID already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const authority = await Authority.create({
      officerId: normalizedOfficerId,
      password: hashedPassword,
      name: req.body.name,
      department: req.body.department,
      area: req.body.area,
    });

    const safeAuthority = authority.toObject();
    delete safeAuthority.password;

    return res.status(201).json({
      success: true,
      message: "Authority created successfully.",
      authority: safeAuthority,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Officer ID already exists.",
      });
    }
    return sendServerError(res, error, "CREATE AUTHORITY ERROR", "Unable to create authority.");
  }
});

// ADMIN: ENABLE/DISABLE AUTHORITY
app.patch(
  "/api/admin/authorities/:id/status",
  requireAuth("admin"),
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) return sendInvalidId(res);

      const isActive = req.body?.isActive;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      const authority = await Authority.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive } },
        { new: true }
      ).select("-password");

      if (!authority) {
        return res.status(404).json({ success: false, message: "Authority not found." });
      }

      return res.json({ success: true, authority });
    } catch (error) {
      return sendServerError(res, error, "AUTHORITY STATUS ERROR", "Unable to update authority.");
    }
  }
);

// ADMIN: ALL CITIZENS (registered accounts + reports ka stats)
app.get("/api/admin/citizens", requireAuth("admin"), async (req, res) => {
  try {
    const [registered, incidents] = await Promise.all([
      Citizen.find().select("-password").lean(),
      Incident.find().select("-image").sort({ createdAt: -1 }).lean(),
    ]);

    const byUserId = new Map();
    const byEmail = new Map();
    const byUsername = new Map();
    const byName = new Map(); // sirf un purani reports ke liye jinme koi ID nahi
    const list = [];

    const newEntry = (data) => ({
      userId: "",
      name: "Citizen",
      username: "",
      email: "",
      registered: false,
      totalReports: 0,
      pending: 0,
      resolved: 0,
      lastReport: null,
      ...data,
    });

    // 1) Registered citizens
    registered.forEach((c) => {
      const entry = newEntry({
        userId: String(c.userId || c._id),
        name: c.fullName || c.username || "Citizen",
        username: normalize(c.username),
        email: normalize(c.email),
        registered: true,
      });
      list.push(entry);
      byUserId.set(entry.userId, entry);
      if (entry.email) byEmail.set(entry.email, entry);
      if (entry.username) byUsername.set(entry.username, entry);
    });

    // 2) Reports ko match karo
    incidents.forEach((incident) => {
      const ic = incident.citizen || {};
      const uid = String(ic.userId || "").trim();
      const email = normalize(ic.email);
      const username = normalize(ic.username);
      const nameKey = normalize(ic.name);

      const hasIdentity = uid || email || username;

      let entry =
        (uid && byUserId.get(uid)) ||
        (email && byEmail.get(email)) ||
        (username && byUsername.get(username)) ||
        (!hasIdentity && byName.get(nameKey));

      if (!entry) {
        entry = newEntry({
          userId: uid,
          name: ic.name || username || "Citizen",
          username,
          email,
          registered: false,
        });
        list.push(entry);
        if (uid) byUserId.set(uid, entry);
        if (email) byEmail.set(email, entry);
        if (username) byUsername.set(username, entry);
        if (!hasIdentity) byName.set(nameKey, entry); // naam se group karo
      }

      entry.totalReports++;

      const status = normalizeStatus(incident.status);
      if (["reported", "pending", "acknowledged"].includes(status)) entry.pending++;
      if (status === "resolved") entry.resolved++;

      if (!entry.lastReport || incident.createdAt > entry.lastReport) {
        entry.lastReport = incident.createdAt;
      }
    });

    // Optional: ?registeredOnly=true se sirf asli accounts
    const result =
      req.query.registeredOnly === "true"
        ? list.filter((c) => c.registered)
        : list;

    return res.json({
      success: true,
      total: result.length,
      registeredCount: registered.length,
      citizens: result,
    });
  } catch (error) {
    return sendServerError(res, error, "GET CITIZENS ERROR", "Unable to fetch citizens.");
  }
});

// ADMIN: ANALYTICS
app.get("/api/admin/analytics", requireAuth("admin"), async (req, res) => {
  try {
    const incidents = await Incident.find().select("-image").lean();

    const byType = {};
    const bySeverity = {};
    const byStatus = {};
    const byLocation = {};

    incidents.forEach((incident) => {
      const type = incident.incidentType || "other";
      const severity =
        incident.aiAssessment?.severity || incident.severity || "unknown";
      const status = incident.status || "reported";
      const location = incident.location?.address || "Unknown location";

      byType[type] = (byType[type] || 0) + 1;
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
      byStatus[status] = (byStatus[status] || 0) + 1;
      byLocation[location] = (byLocation[location] || 0) + 1;
    });

    return res.json({
      success: true,
      analytics: {
        total: incidents.length,
        byType,
        bySeverity,
        byStatus,
        byLocation,
      },
    });
  } catch (error) {
    return sendServerError(res, error, "ADMIN ANALYTICS ERROR", "Unable to fetch admin analytics.");
  }
});

// AI INCIDENT ANALYSIS (+ MONGODB SAVE jab previewOnly na ho)
// Sirf citizen. Citizen ki pehchaan token se aati hai, body se nahi.
app.post("/api/analyze-incident", requireAuth("citizen"), async (req, res) => {
  // Agar save fail ho jaye to duplicate key hata di jaati hai (#26)
  let dupKeyToClear = null;

  try {
    const {
      location,
      description,
      type,
      severity,
      lat,
      lon,
      image,
      previewOnly,
    } = req.body || {};

    const isPreview = previewOnly === true;

    const me = await Citizen.findById(req.auth.id).lean();

    if (!me) {
      return res.status(401).json({
        success: false,
        message: "Account not found. Please log in again.",
      });
    }

    const citizenUserId = String(me.userId || me._id).trim();
    const citizenEmail = normalize(me.email);
    const citizenUsername = normalize(me.username);
    const citizenName = String(me.fullName || "").trim();

    if (!String(description || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Incident description is required.",
      });
    }

    const address =
      typeof location === "string"
        ? location
        : location?.address || "Unknown location";

    // Duplicate submit check (sirf asli save ke liye, preview ke liye nahi)
    const dupKey = [
      citizenUserId || citizenEmail || citizenUsername,
      String(description).trim(),
      address,
    ].join("|");

    if (!isPreview) {
      const lastSeen = recentSubmissions.get(dupKey);

      if (lastSeen && Date.now() - lastSeen < 15000) {
        console.log("DUPLICATE REPORT IGNORED");
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: "Duplicate submission ignored.",
        });
      }

      recentSubmissions.set(dupKey, Date.now());
      dupKeyToClear = dupKey;
      setTimeout(() => recentSubmissions.delete(dupKey), 15000);
    }

    const latitude = parseCoordinate(lat ?? location?.latitude ?? location?.lat);
    const longitude = parseCoordinate(lon ?? location?.longitude ?? location?.lon);

    const prompt = `
You are an AI assistant for a traffic incident reporting system.
Return ONLY valid JSON with keys:
incidentType, severity, riskIndicators, summary, recommendation.
incidentType: accident, road-block, congestion, vehicle-breakdown, other.
severity: Low, Medium, High, Critical.
riskIndicators must be an array of short strings.
summary and recommendation must be concise.
Do not claim certainty when information is insufficient.
This is advisory information only.
Incident type: ${type || "unknown"}
Reported severity: ${severity || "unknown"}
Location: ${address}
Description: ${String(description).trim()}
`;

    let analysis = null;

    if (process.env.GROQ_API_KEY) {
      try {
        const completion = await client.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: "Return only valid JSON. Do not use Markdown.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        });

        const content = completion.choices?.[0]?.message?.content || "";

        const cleaned = content
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");

        if (start !== -1 && end > start) {
          analysis = JSON.parse(cleaned.slice(start, end + 1));
        }
      } catch (aiError) {
        console.error("GROQ ANALYSIS ERROR:", aiError.message);
      }
    }

    if (!analysis) {
      analysis = {
        incidentType: type || "other",
        severity: severity || "Medium",
        riskIndicators: ["Manual authority verification required"],
        summary: String(description).trim().slice(0, 300),
        recommendation:
          "The relevant authority should verify the report and assess the situation.",
      };
    }

    // "Analyze with AI" button sirf analysis chahta hai, DB me save nahi
    if (isPreview) {
      return res.json({
        success: true,
        preview: true,
        message: "AI analysis completed (not saved).",
        analysis,
      });
    }

    const savedImage =
      typeof image === "string" &&
      (image.startsWith("data:image/") || /^https?:\/\//i.test(image))
        ? image
        : "";

    const incident = await Incident.create({
      citizen: {
        userId: citizenUserId,
        name: citizenName || citizenUsername || "Citizen",
        username: citizenUsername,
        email: citizenEmail,
      },
      incidentType: type || "other",
      severity: severity || "Medium",
      description: String(description).trim(),
      image: savedImage,
      location: {
        address,
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
      },
      aiAssessment: {
        incidentType: analysis.incidentType || type || "other",
        severity: analysis.severity || severity || "Medium",
        riskIndicators: Array.isArray(analysis.riskIndicators)
          ? analysis.riskIndicators
          : [],
        summary: analysis.summary || "",
        recommendation: analysis.recommendation || "",
      },
      status: "reported",
      assignedTeam: "",
      resolutionNote: "",
    });

    // Save ho gaya, ab duplicate key rehne do (15 second ke liye)
    dupKeyToClear = null;

    return res.status(201).json({
      success: true,
      message: "Incident analyzed and saved successfully.",
      analysis,
      incident,
    });
  } catch (error) {
    // Save fail hua to key hata do, taaki user dobara try kar sake
    if (dupKeyToClear) recentSubmissions.delete(dupKeyToClear);

    return sendServerError(
      res,
      error,
      "ANALYZE INCIDENT ERROR",
      "Unable to analyze and save incident."
    );
  }
});

// START SERVER AFTER DATABASE CONNECTION
async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    await connectDB();

    app.listen(PORT, () => {
      console.log(`SmartTraffic backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error);
    process.exit(1);
  }
}

startServer();