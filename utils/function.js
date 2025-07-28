import nodemailer from "nodemailer";

// Hàm gửi mail
const sendMail = async (to, subject, text) => {
  // Cấu hình transporter với Gmail hoặc SMTP server của bạn
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // email gửi đi
      pass: process.env.EMAIL_PASS, // mật khẩu ứng dụng (app password)
    },
  });

  await transporter.sendMail({
    from: `"Shop Online" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};
export { sendMail };
