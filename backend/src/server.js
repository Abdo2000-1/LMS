import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { query } from "./db.js";
import { createToken, requireAuth } from "./auth.js";
import {
  normalizeEmail,
  validateLoginBody,
  validateProfileUpdateBody,
  validateRegisterBody,
} from "./validation.js";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: false,
  })
);
app.use(express.json({ limit: "32kb" }));

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "TOO_MANY_REQUESTS",
    message: "محاولات كتير جدًا، حاول مرة تانية بعد دقائق.",
  },
});

function toPublicUser(dbUser) {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    grade: dbUser.grade,
  };
}

app.get("/api/health", async (req, res, next) => {
  try {
    await query("SELECT 1 AS ok");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", authLimiter, async (req, res, next) => {
  const validationError = validateRegisterBody(req.body);
  if (validationError) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: validationError });
  }

  const name = String(req.body.name).trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password);
  const role = String(req.body.role).trim();
  const grade = role === "student" ? String(req.body.grade).trim() : null;

  try {
    const existingUsersResult = await query("SELECT TOP 1 id FROM users WHERE email = @email", { email });
    if (existingUsersResult.recordset.length > 0) {
      return res.status(409).json({
        code: "EMAIL_TAKEN",
        message: "البريد الإلكتروني ده مستخدم بالفعل، جرب تسجل دخول بدل كده.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash, role, grade)
       OUTPUT INSERTED.id
       VALUES (@name, @email, @passwordHash, @role, @grade)`,
      { name, email, passwordHash, role, grade }
    );

    const user = { id: insertResult.recordset[0].id, name, email, role, grade };
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/auth/login", authLimiter, async (req, res, next) => {
  const validationError = validateLoginBody(req.body);
  if (validationError) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: validationError });
  }

  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password);

  try {
    const usersResult = await query("SELECT TOP 1 * FROM users WHERE email = @email", { email });
    const user = usersResult.recordset[0];

    const isMatch = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!isMatch) {
      return res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: "بيانات تسجيل الدخول غير صحيحة.",
      });
    }

    const safeUser = toPublicUser(user);
    const token = createToken(safeUser);
    return res.json({ user: safeUser, token });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/users/me", requireAuth, async (req, res, next) => {
  const validationError = validateProfileUpdateBody(req.body);
  if (validationError) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: validationError });
  }

  const id = Number(req.auth.sub);
  const name = String(req.body.name).trim();

  try {
    const updateResult = await query(
      "UPDATE users SET name = @name, updated_at = SYSUTCDATETIME() WHERE id = @id",
      { id, name }
    );
    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({ code: "USER_NOT_FOUND", message: "المستخدم غير موجود." });
    }

    const usersResult = await query("SELECT TOP 1 id, name, email, role, grade FROM users WHERE id = @id", { id });
    return res.json({ user: usersResult.recordset[0] });
  } catch (error) {
    return next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ code: "INTERNAL_ERROR", message: "حصل خطأ غير متوقع في السيرفر." });
});

app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
});
