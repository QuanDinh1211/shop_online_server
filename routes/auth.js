import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import db from "../config/database.js";

const router = express.Router();

// Lưu tạm mã xác thực (demo, nên dùng Redis hoặc DB thật)
const resetCodes = {};

// POST /auth/register - Đăng ký tài khoản mới
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin bắt buộc",
        message: "name, email và password là bắt buộc",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Email không hợp lệ",
        message: "Vui lòng nhập email đúng định dạng",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Mật khẩu quá ngắn",
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Email đã tồn tại",
        message: "Email này đã được sử dụng, vui lòng chọn email khác",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo user mới
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    const userId = result.insertId;

    // Tạo JWT token
    const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: {
        user: {
          id: userId,
          name,
          email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({
      success: false,
      error: "Không thể tạo tài khoản",
      message: error.message,
    });
  }
});

// POST /auth/login - Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin đăng nhập",
        message: "email và password là bắt buộc",
      });
    }

    // Tìm user theo email
    const [users] = await db.execute(
      "SELECT id, name, email, password FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Thông tin đăng nhập không chính xác",
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const user = users[0];

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Thông tin đăng nhập không chính xác",
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({
      success: false,
      error: "Không thể đăng nhập",
      message: error.message,
    });
  }
});

// POST /auth/forgot-password - Gửi mã xác thực quên mật khẩu
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email là bắt buộc" });
    }
    const [users] = await db.execute("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy email" });
    }
    // Sinh mã xác thực 6 số
    const code = crypto.randomInt(100000, 999999).toString();
    resetCodes[email] = code;

    // Tạo link đổi mật khẩu (FE sẽ nhận link này và render form đổi mật khẩu)
    const resetLink = `https://your-frontend-domain.com/reset-password?email=${encodeURIComponent(
      email
    )}&code=${code}`;

    // Gửi email chứa link
    await sendMail(
      email,
      "Yêu cầu đổi mật khẩu",
      `<p>Bạn vừa yêu cầu đổi mật khẩu. Nhấn vào link bên dưới để đặt lại mật khẩu:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Nếu không phải bạn thực hiện, hãy bỏ qua email này.</p>`
    );

    res.json({ success: true, message: "Đã gửi link đổi mật khẩu qua email" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
});

// POST /auth/reset-password - Đổi mật khẩu bằng mã xác thực
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin" });
    }
    if (resetCodes[email] !== code) {
      return res
        .status(400)
        .json({ success: false, message: "Mã xác thực không đúng" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu phải >= 6 ký tự" });
    }
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await db.execute("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);
    delete resetCodes[email];
    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
});

export default router;
