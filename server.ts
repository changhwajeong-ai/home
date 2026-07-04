import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

dotenv.config();

const firebaseConfig = {
  projectId: "gen-lang-client-0042466970",
  appId: "1:971476315513:web:97d4c3a4b40ca7cdce13a8",
  apiKey: "AIzaSyCvV-Kb0sL4LUC3gwT6cDJLsBy23VTM8_s",
  authDomain: "gen-lang-client-0042466970.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-9b9d7f9e-bf88-43db-b93f-a66556d3fcb5",
  storageBucket: "gen-lang-client-0042466970.firebasestorage.app",
  messagingSenderId: "971476315513"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

async function getEmailSettings(): Promise<any> {
  try {
    const docRef = doc(db, "settings", "email");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error("Failed to fetch email settings from Firestore:", err);
  }
  return null;
}

const app = express();
const PORT = 3000;

// Middleware for JSON parsing (extended limit for large files like CAD, Catalogs)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Google GenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log("Google GenAI SDK initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Google GenAI SDK:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined. AI support chatbot will fall back to local responses.");
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(UPLOADS_DIR));

// File Upload Endpoint (handles large base64 uploads)
app.post("/api/upload", (req, res) => {
  const { filename, fileData } = req.body;
  if (!filename || !fileData) {
    return res.status(400).json({ error: "Missing filename or fileData" });
  }

  try {
    let base64Content = fileData;
    if (fileData.includes(";base64,")) {
      base64Content = fileData.split(";base64,")[1];
    }

    const buffer = Buffer.from(base64Content, "base64");
    
    // Create a unique filename but keep original readable name
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_-]/g, "_");
    const uniqueFilename = `${baseName}_${Date.now()}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);

    fs.writeFileSync(filePath, buffer);
    
    const fileUrl = `/uploads/${uniqueFilename}`;
    console.log(`[Upload Success] File saved to ${filePath}. URL: ${fileUrl}`);
    res.json({ success: true, fileUrl, filename: uniqueFilename });
  } catch (err: any) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Failed to save file on server", details: err.message });
  }
});

// Inquiry Alert Email
app.post("/api/notify-inquiry", async (req, res) => {
  const { name, email, phone, title, content, type, date, isPrivate } = req.body;
  
  // Load email settings from Firestore if available
  const emailSettings = await getEmailSettings();
  
  const recipient = emailSettings?.recipient || "dongwoo116@daum.net, dongwoo116@hanmail.net";
  const smtpHost = emailSettings?.smtpHost || process.env.SMTP_HOST;
  const smtpPort = parseInt(emailSettings?.smtpPort?.toString() || process.env.SMTP_PORT || "587");
  const smtpUser = emailSettings?.smtpUser || process.env.SMTP_USER;
  const smtpPass = emailSettings?.smtpPass || process.env.SMTP_PASS;
  const smtpFrom = emailSettings?.smtpFrom || process.env.SMTP_FROM || smtpUser || "no-reply@doongwoo.net";

  const subject = `[동우산업 알림] 신규 고객 문의 및 기술자료 신청 접수 (${name}님)`;
  
  const mailText = `
동우산업(주) 도로안전시설물 카탈로그 - 신규 고객 문의 알림

성함/업체명: ${name}
연락처: ${phone}
회신 이메일: ${email || "미입력"}
업무 분류: ${type}
공개 여부: ${isPrivate ? "비공개 (제목만 노출)" : "공개 (전체 노출)"}
접수 일자: ${date}

문의 제목: ${title}

상세 내용:
--------------------------------------------------
${content}
--------------------------------------------------

본 메일은 동우산업(주) 온라인 웹 카탈로그 시스템에서 자동으로 발송된 알림 메일입니다.
상담 처리 및 관리는 관리자 CMS 시스템(또는 DB)을 확인해 주시기 바랍니다.
  `;

  const mailHtml = `
    <div style="font-family: 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-top: 0;">📨 동우산업(주) 신규 고객 문의 알림</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">동우산업 온라인 웹 카탈로그에 새로운 기술상담 및 자문/자료요청 문의가 접수되었습니다.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
        <tr style="background-color: #f8fafc;">
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; width: 30%; font-weight: bold;">이름/업체명</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${name}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">연락처</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #0284c7;">${phone}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">회신 이메일</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${email || '미입력'}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">업무 분류</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;"><span style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${type}</span></td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">공개 여부</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${isPrivate ? '<strong style="color: #ef4444;">비공개 (제목만 노출)</strong>' : '<strong style="color: #22c55e;">공개 (전체 노출)</strong>'}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">접수 일자</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${date}</td>
        </tr>
      </table>
      
      <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h4 style="margin: 0 0 8px 0; color: #ea580c; font-size: 14px;">제목: ${title}</h4>
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${content}</p>
      </div>
      
      <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        본 메일은 동우산업(주) 온라인 웹 카탈로그 시스템에서 자동으로 발송되었습니다.<br />
        상담 상세 관리 및 답변 처리는 관리자 CMS 시스템에서 진행해 주십시오.
      </p>
    </div>
  `;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false, // Prevents certificate chain validation failures
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: recipient,
        subject: subject,
        text: mailText,
        html: mailHtml,
      });

      console.log(`[Email Sent] Success sending email to ${recipient}`);
      return res.json({ success: true, message: "메일 발송 완료!" });
    } catch (error: any) {
      console.error("[Email Error] Failed to send email via SMTP:", error);
      return res.status(500).json({ 
        success: false, 
        error: "SMTP 메일 발송에 실패했습니다.", 
        details: error.message,
        loggedText: mailText
      });
    }
  } else {
    console.log("=========================================");
    console.log("[SMTP 미설정] 알림 이메일 시뮬레이션 로그:");
    console.log(`To: ${recipient}`);
    console.log(`Subject: ${subject}`);
    console.log(mailText);
    console.log("=========================================");
    return res.json({ 
      success: true, 
      simulated: true, 
      message: "SMTP 정보가 설정되어 있지 않아, 문의 내용이 서버 시스템 로그에 안전하게 기록 및 시뮬레이션되었습니다. 실제 이메일을 발송하려면 secrets 혹은 관리자 CMS의 이메일 설정을 통해 SMTP 정보를 등록해 주세요.",
      loggedText: mailText
    });
  }
});

// Inquiry Reply Email
app.post("/api/reply-inquiry", async (req, res) => {
  const { name, email, title, content, answer } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "회신을 보낼 고객의 이메일 주소가 없습니다." });
  }

  // Load email settings from Firestore if available
  const emailSettings = await getEmailSettings();
  
  const smtpHost = emailSettings?.smtpHost || process.env.SMTP_HOST;
  const smtpPort = parseInt(emailSettings?.smtpPort?.toString() || process.env.SMTP_PORT || "587");
  const smtpUser = emailSettings?.smtpUser || process.env.SMTP_USER;
  const smtpPass = emailSettings?.smtpPass || process.env.SMTP_PASS;
  const smtpFrom = emailSettings?.smtpFrom || process.env.SMTP_FROM || smtpUser || "no-reply@doongwoo.net";

  const subject = `[동우산업] 문의하신 내용에 대한 공식 답변이 등록되었습니다.`;
  
  const mailText = `
안녕하세요, ${name}님.
동우산업(주) 도로안전시설물 온라인 카탈로그를 이용해 주셔서 진심으로 감사드립니다.
고객님께서 남겨주신 기술/견적문의에 대한 검토 답변을 아래와 같이 안내해 드립니다.

■ 문의 제목: ${title}

■ 상세 문의 내용:
${content}

--------------------------------------------------
■ 동우산업(주) 담당 부서 공식 회신 내용:
${answer}
--------------------------------------------------

추가 문의사항은 고객센터 대표번호 031-965-1133으로 연락해 주시기 바랍니다.
감사합니다.

동우산업(주) 드림.
  `;

  const mailHtml = `
    <div style="font-family: 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-top: 0;">✉️ 동우산업(주) 문의 답변 안내</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">안녕하세요, <strong>${name}</strong>님.</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">동우산업(주) 도로안전시설물 온라인 카탈로그를 이용해 주셔서 진심으로 감사드립니다.<br>신청해 주신 기술문의/견적문의에 대한 담당 기술부서의 공식 검토 답변을 아래와 같이 안내해 드립니다.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 0 0 5px 0; font-size: 11px; color: #94a3b8; font-weight: bold;">문의 제목</p>
        <p style="margin: 0 0 15px 0; font-size: 13px; color: #1e293b; font-weight: bold;">${title}</p>
        <p style="margin: 0 0 5px 0; font-size: 11px; color: #94a3b8; font-weight: bold;">상세 문의 내용</p>
        <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5; white-space: pre-wrap;">${content}</p>
      </div>
      
      <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #ea580c; font-size: 14px; font-weight: bold;">동우안전 담당 기술부서 공식 회신 내용</h3>
        <p style="margin: 0; font-size: 13px; color: #1c1917; line-height: 1.6; white-space: pre-wrap; font-weight: bold;">${answer}</p>
      </div>
      
      <p style="font-size: 13px; color: #475569; line-height: 1.6;">추가적으로 궁금하신 규격 도면에 대한 기술 자문 및 수량별 도매 단가 견적은 고객센터 대표번호 <b>031-965-1133</b>으로 전화 주시면 더욱 친절하고 신속히 상담해 드리겠습니다.</p>
      
      <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        본 메일은 동우산업(주) 온라인 웹 카탈로그 시스템에서 작성한 답변을 바탕으로 자동 전송된 발송전용 이메일입니다.<br>
        Copyright © Dongwoo Industry Co., Ltd. All Rights Reserved.
      </p>
    </div>
  `;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: subject,
        text: mailText,
        html: mailHtml,
      });

      console.log(`[Reply Sent] Success sending reply email to inquirer: ${email}`);
      return res.json({ success: true, message: "회신 이메일 발송 완료!" });
    } catch (error: any) {
      console.error("[Reply Email Error] Failed to send email via SMTP:", error);
      return res.status(500).json({ 
        success: false, 
        error: "SMTP 메일 발송에 실패했습니다.", 
        details: error.message,
        loggedText: mailText
      });
    }
  } else {
    console.log("=========================================");
    console.log("[SMTP 미설정] 회신 이메일 시뮬레이션 로그:");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(mailText);
    console.log("=========================================");
    return res.json({ 
      success: true, 
      simulated: true, 
      message: "SMTP 정보가 설정되어 있지 않아, 문의 회신 답변 내용이 서버 로그에 기록 및 시뮬레이션되었습니다. 실제 이메일을 발송하려면 secrets 혹은 관리자 CMS의 이메일 설정을 통해 SMTP 정보를 등록해 주세요.",
      loggedText: mailText
    });
  }
});

// AI Assistant endpoint (Gemini API)
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages array." });
  }

  // Fallback if AI key is missing
  if (!ai) {
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let mockResponse = "현재 AI 서비스 키가 설정되어 있지 않습니다. 문의사항은 '고객센터 > 문의하기' 메뉴를 이용하시거나 031-965-1133으로 연락주시면 친절히 안내해 드리겠습니다.";
    
    if (lastUserMessage.includes("볼라드")) {
      mockResponse = "동우안전의 대표 볼라드는 '고정식 스틸 볼라드(DW-S100)'와 '고탄성 우레탄 볼라드(DW-U80)', '고급 화강석 석재 볼라드(DW-G250)'가 있습니다. 용도에 맞게 선택하여 비교해보실 수 있습니다.";
    } else if (lastUserMessage.includes("도면") || lastUserMessage.includes("다운로드")) {
      mockResponse = "제품 도면(DWG) 및 카탈로그(PDF) 자료는 '제품소개 상세페이지' 혹은 '기술자료 > 다운로드 센터'에서 무료로 다운로드 받으실 수 있습니다.";
    }

    return res.json({ response: mockResponse });
  }

  try {
    // Formulate system instructions containing our products
    const systemInstruction = `
You are the AI Sales and Technical Representative for "DONGWOO" (동우안전), Korea's leading road safety facilities online catalog.
Your goal is to assist construction managers, engineers, sales representatives, and public officials in finding the perfect road safety products (bollards, signs, lane separators, fences, etc.).

Here is our catalog data:
1. "고정식 스틸 볼라드 (DW-S100)": Made of carbon steel pipe. Size: Ø101.6 x 3.2t. Height: 850mm. Features: Hot-dip galvanized & powder coated. Installation: Concrete anchor fixing. Perfect for heavy-duty protection.
2. "고탄성 우레탄 볼라드 (DW-U80)": Made of flexible polyurethane. Size: Ø150 x 800H. Height: 800mm. Features: Perfect self-recovery after crash, shock absorption. Installation: Anchor/embedded. Excellent for car damage minimization.
3. "고급 화강석 석재 볼라드 (DW-G250)": Made of natural granite stone. Size: Ø250 x 700H. Height: 700mm. Elegant texture, semi-permanent durability.
4. "고휘도 도로 안내 표지판": Aluminum plate + ASTM high-intensity reflective sheet. Exceptional night visibility. Sizing is custom.
5. "우레탄 무단횡단금지 차선분리대": Polyethylene + urethane joint. 2000L x 150W x 900H. Reduces pedestrian crash rates.

Instructions:
- Always answer in Korean politely, unless the user queries in English.
- Be highly professional, helpful, and technically accurate.
- Suggest appropriate products based on user needs (e.g., if they ask for crash resistance, recommend Steel; if they ask for car protection, recommend Urethane; for landscaping, recommend Granite).
- Keep answers concise and easy to read. Mention that CAD drawing and PDF downloads are available in the catalog.
`;

    const chatHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: msg.content }]
    }));

    const currentMsg = messages[messages.length - 1].content;

    // Use gemini-2.5-flash as the fast and reliable standard model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: currentMsg }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    res.json({ response: response.text });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "Gemini API failed to process request.", details: err.message });
  }
});

// -------------------------------------------------------------
// Vite Dev / Static Assets Prod Routing
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Mount Vite dev middlewares
    app.use(vite.middlewares);
    console.log("Vite development server mounted.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production build from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
