import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const smtpPort = Number(process.env.EMAIL_PORT || 587);
const smtpHost = process.env.EMAIL_HOST;
const smtpUser = process.env.EMAIL_USER;
const smtpPass = process.env.EMAIL_PASS?.replace(/\s+/g, "");
const emailFrom = process.env.EMAIL_FROM || smtpUser;

const mailTransporter =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport(
        smtpHost.includes("gmail")
          ? {
              service: "gmail",
              auth: { user: smtpUser, pass: smtpPass }
            }
          : {
              host: smtpHost,
              port: smtpPort,
              secure: smtpPort === 465,
              auth: { user: smtpUser, pass: smtpPass }
            }
      )
    : null;

/**
 * Sends a verification code email.
 * @param email - Recipient's email address
 * @param code - 6-digit verification code
 * @param type - 'deposit' or 'reset'
 */
export const sendEmailCode = async (email: string, code: string, type: 'deposit' | 'reset') => {
  const subject = type === 'deposit' 
    ? "portfol.io Ödeme Doğrulama Kodu" 
    : "portfol.io Şifre Sıfırlama Kodu";
    
  const text = type === 'deposit'
    ? `Ödeme işleminiz için doğrulama kodunuz: ${code}. Bu kod 10 dakika geçerlidir.`
    : `Şifre sıfırlama işleminiz için doğrulama kodunuz: ${code}. Bu kod 1 saat geçerlidir.`;

  console.log(`[EMAIL SYSTEM] Sending ${type} code to: ${email}`);

  if (!mailTransporter || !emailFrom) {
    console.warn("[EMAIL SYSTEM] SMTP settings missing. Simulation mode active.");
    console.log(`[SIMULATION] To: ${email}, Subject: ${subject}, Code: ${code}`);
    return;
  }

  try {
    const info = await mailTransporter.sendMail({
      from: emailFrom,
      to: email,
      subject,
      text
    });
    console.log(`[EMAIL SYSTEM] Email sent successfully: ${info.messageId}`);
  } catch (err: any) {
    console.error("[EMAIL SYSTEM] Error sending email:", err.message);
    throw err; // Re-throw to allow API to return error status
  }
};
