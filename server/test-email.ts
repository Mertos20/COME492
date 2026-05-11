import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const smtpPort = Number(process.env.EMAIL_PORT || 587);
const smtpHost = process.env.EMAIL_HOST;
const smtpUser = process.env.EMAIL_USER;
const smtpPass = process.env.EMAIL_PASS?.replace(/\s+/g, "");
const emailFrom = process.env.EMAIL_FROM || smtpUser;

async function testEmail() {
  console.log("--- SMTP Test Script ---");
  console.log(`Host: ${smtpHost}`);
  console.log(`Port: ${smtpPort}`);
  console.log(`User: ${smtpUser}`);
  console.log(`Pass length: ${smtpPass?.length || 0}`);
  
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error("Missing SMTP credentials in .env");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });

  try {
    console.log("Verifying connection...");
    await transporter.verify();
    console.log("Connection verified successfully!");

    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: emailFrom,
      to: smtpUser, // Send to self
      subject: "portfol.io SMTP Test",
      text: "If you see this, your SMTP settings are correct!"
    });
    console.log(`Email sent! Message ID: ${info.messageId}`);
  } catch (err: any) {
    console.error("SMTP Error:", err.message);
    if (err.code === 'EAUTH') {
      console.error("Authentication failed. Check your App Password.");
    }
  }
}

testEmail();
