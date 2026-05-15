import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

interface MailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const mailHost = process.env.MAIL_HOST || "mail.sfcinemacity.com";
  const mailPort = parseInt(process.env.MAIL_PORT || "25", 10);
  const mailTimeout = parseInt(process.env.MAIL_TIMEOUT || "10000", 10);

  const options: SMTPTransport.Options = {
    host: mailHost,
    port: mailPort,
    secure: false,
    auth: undefined,
    connectionTimeout: mailTimeout,
    tls: { rejectUnauthorized: false },
  };

  transporter = nodemailer.createTransport(options);

  return transporter;
}

export async function sendMail(options: MailOptions) {
  try {
    const transporter = getTransporter();

    // Default BCC to managers
    const defaultBcc = (process.env.MAIL_BCC || "").split(";").filter(Boolean);
    const bcc = options.bcc
      ? Array.isArray(options.bcc)
        ? [...options.bcc, ...defaultBcc]
        : [options.bcc, ...defaultBcc]
      : defaultBcc;

    const result = await transporter.sendMail({
      from: options.from || process.env.MAIL_FROM || "noreply@sfcinema.com",
      replyTo: options.replyTo,
      to: options.to,
      cc: options.cc,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Failed to send mail:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendInvitationEmail(
  recipientEmail: string,
  recipientName: string,
  inviterName: string,
  inviterEmail: string | null | undefined,
  projectName: string,
  inviteLink: string,
) {
  const subject = `${inviterName} ได้เชิญคุณเข้าร่วม Project: ${projectName}`;
  const fromDisplay = `"${inviterName} via SF Task" <${process.env.MAIL_FROM || "noreply@sfcinema.com"}>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>คำเชิญเข้าร่วม Project</h2>
      
      <p>สวัสดี ${recipientName},</p>
      
      <p><strong>${inviterName}</strong> ได้เชิญคุณเข้าร่วม project: <strong>${projectName}</strong></p>
      
      <p>คลิกปุ่มด้านล่างเพื่อตอบรับหรือปฏิเสธคำเชิญ:</p>
      
      <div style="margin: 30px 0;">
        <a href="${inviteLink}" style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
          ดูคำเชิญ
        </a>
      </div>
      
      <p style="color: #666; font-size: 12px;">
        หรือคัดลอกลิงก์นี้ไปในเบราว์เซอร์: <br />
        ${inviteLink}
      </p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
      
      <p style="color: #999; font-size: 12px;">
        นี้คือเมลอัตโนมัติจากระบบ Task Management ของ SF Cinema City<br />
        โปรดอย่าตอบกลับเมลนี้
      </p>
    </div>
  `;

  return sendMail({
    to: recipientEmail,
    subject,
    html,
    from: fromDisplay,
    replyTo: inviterEmail || undefined,
  });
}

export async function sendTaskAssignmentEmail(
  recipientEmail: string,
  recipientName: string,
  assignerName: string,
  assignerEmail: string | null | undefined,
  projectName: string,
  taskTitle: string,
  taskLink: string,
) {
  const subject = `${assignerName} ได้มอบหมายงานให้คุณใน Project: ${projectName}`;
  const fromDisplay = `"${assignerName} via SF Task" <${process.env.MAIL_FROM || "noreply@sfcinema.com"}>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>คุณได้รับมอบหมายงานใหม่</h2>
      <p>สวัสดี ${recipientName},</p>
      <p><strong>${assignerName}</strong> ได้มอบหมายงาน <strong>${taskTitle}</strong> ให้คุณใน project: <strong>${projectName}</strong></p>
      <p>คลิกปุ่มด้านล่างเพื่อดูรายละเอียดงาน:</p>
      <div style="margin: 30px 0;">
        <a href="${taskLink}" style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
          ดูงานที่ได้รับมอบหมาย
        </a>
      </div>
      <p style="color: #666; font-size: 12px;">
        หรือคัดลอกลิงก์นี้ไปในเบราว์เซอร์: <br />
        ${taskLink}
      </p> 
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">
        นี้คือเมลอัตโนมัติจากระบบ Task Management ของ SF Cinema City<br />
        โปรดอย่าตอบกลับเมลนี้
      </p>
    </div>
  `;

  return sendMail({
    to: recipientEmail,
    subject,
    html,
    from: fromDisplay,
    replyTo: assignerEmail || undefined,
  });
}

// แจ้งอัพเดต step หรือสถานะงาน
export async function sendTaskUpdateEmail(
  recipientEmail: string,
  recipientName: string,
  updaterName: string,
  updaterEmail: string | null | undefined,
  projectName: string,
  taskTitle: string,
  updateType: "status" | "step",
  updateValue: string,
  taskLink: string,
) {
  const subject = `${updaterName} ได้อัพเดตงานของคุณใน Project: ${projectName}`;
  const fromDisplay = `"${updaterName} via SF Task" <${process.env.MAIL_FROM || "noreply@sfcinema.com"}>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>งานของคุณได้รับการอัพเดต</h2>
      <p>สวัสดี ${recipientName},</p>
      <p><strong>${updaterName}</strong> ได้อัพเดตงาน <strong>${taskTitle}</strong> ของคุณใน project: <strong>${projectName}</strong></p>
      <p>ประเภทการอัพเดต: <strong>${updateType}</strong></p>
      <p>ค่าที่อัพเดต: <strong>${updateValue}</strong></p>
      <p>คลิกปุ่มด้านล่างเพื่อดูรายละเอียดงาน:</p>
      <div style="margin: 30px 0;">
        <a href="${taskLink}" style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
          ดูงานที่อัพเดต
        </a>
      </div>
      <p style="color: #666; font-size: 12px;">
        หรือคัดลอกลิงก์นี้ไปในเบราว์เซอร์: <br />
        ${taskLink}
      </p> 
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">
        นี้คือเมลอัตโนมัติจากระบบ Task Management ของ SF Cinema City<br />
        โปรดอย่าตอบกลับเมลนี้
      </p>
    </div>
  `;

  return sendMail({
    to: recipientEmail,
    subject,
    html,
    from: fromDisplay,
    replyTo: updaterEmail || undefined,
  });
}
