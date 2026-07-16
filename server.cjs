var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
import_dotenv.default.config();
var firebaseConfig = {
  projectId: "gen-lang-client-0042466970",
  appId: "1:971476315513:web:97d4c3a4b40ca7cdce13a8",
  apiKey: "AIzaSyCvV-Kb0sL4LUC3gwT6cDJLsBy23VTM8_s",
  authDomain: "gen-lang-client-0042466970.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-9b9d7f9e-bf88-43db-b93f-a66556d3fcb5",
  storageBucket: "gen-lang-client-0042466970.firebasestorage.app",
  messagingSenderId: "971476315513"
};
var fbApp = (0, import_app.initializeApp)(firebaseConfig);
var db = (0, import_firestore.getFirestore)(fbApp, firebaseConfig.firestoreDatabaseId);
async function getEmailSettings() {
  try {
    const docRef = (0, import_firestore.doc)(db, "settings", "email");
    const docSnap = await (0, import_firestore.getDoc)(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error("Failed to fetch email settings from Firestore:", err);
  }
  return null;
}
var app = (0, import_express.default)();
var PORT = process.env.PORT || 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
var apiKey = process.env.GEMINI_API_KEY;
var ai = null;
if (apiKey) {
  try {
    ai = new import_genai.GoogleGenAI({ apiKey });
    console.log("Google GenAI SDK initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Google GenAI SDK:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined. AI support chatbot will fall back to local responses.");
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
var UPLOADS_DIR = import_path.default.join(process.cwd(), "uploads");
if (!import_fs.default.existsSync(UPLOADS_DIR)) {
  import_fs.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", import_express.default.static(UPLOADS_DIR));
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
    const ext = import_path.default.extname(filename);
    const baseName = import_path.default.basename(filename, ext).replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_-]/g, "_");
    const uniqueFilename = `${baseName}_${Date.now()}${ext}`;
    const filePath = import_path.default.join(UPLOADS_DIR, uniqueFilename);
    import_fs.default.writeFileSync(filePath, buffer);
    const fileUrl = `/uploads/${uniqueFilename}`;
    console.log(`[Upload Success] File saved to ${filePath}. URL: ${fileUrl}`);
    res.json({ success: true, fileUrl, filename: uniqueFilename });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Failed to save file on server", details: err.message });
  }
});
app.post("/api/notify-inquiry", async (req, res) => {
  const { name, email, phone, title, content, type, date, isPrivate } = req.body;
  const emailSettings = await getEmailSettings();
  const recipient = emailSettings?.recipient || "dongwoo116@daum.net, dongwoo116@hanmail.net";
  const smtpHost = emailSettings?.smtpHost || process.env.SMTP_HOST;
  const smtpPort = parseInt(emailSettings?.smtpPort?.toString() || process.env.SMTP_PORT || "587");
  const smtpUser = emailSettings?.smtpUser || process.env.SMTP_USER;
  const smtpPass = emailSettings?.smtpPass || process.env.SMTP_PASS;
  const smtpFrom = emailSettings?.smtpFrom || process.env.SMTP_FROM || smtpUser || "no-reply@doongwoo.net";
  const subject = `[\uB3D9\uC6B0\uC0B0\uC5C5 \uC54C\uB9BC] \uC2E0\uADDC \uACE0\uAC1D \uBB38\uC758 \uBC0F \uAE30\uC220\uC790\uB8CC \uC2E0\uCCAD \uC811\uC218 (${name}\uB2D8)`;
  const mailText = `
\uB3D9\uC6B0\uC0B0\uC5C5(\uC8FC) \uB3C4\uB85C\uC548\uC804\uC2DC\uC124\uBB3C \uCE74\uD0C8\uB85C\uADF8 - \uC2E0\uADDC \uACE0\uAC1D \uBB38\uC758 \uC54C\uB9BC

\uC131\uD568/\uC5C5\uCCB4\uBA85: ${name}
\uC5F0\uB77D\uCC98: ${phone}
\uD68C\uC2E0 \uC774\uBA54\uC77C: ${email || "\uBBF8\uC785\uB825"}
\uC5C5\uBB34 \uBD84\uB958: ${type}
\uACF5\uAC1C \uC5EC\uBD80: ${isPrivate ? "\uBE44\uACF5\uAC1C (\uC81C\uBAA9\uB9CC \uB178\uCD9C)" : "\uACF5\uAC1C (\uC804\uCCB4 \uB178\uCD9C)"}
\uC811\uC218 \uC77C\uC790: ${date}

\uBB38\uC758 \uC81C\uBAA9: ${title}

\uC0C1\uC138 \uB0B4\uC6A9:
--------------------------------------------------
${content}
--------------------------------------------------

\uBCF8 \uBA54\uC77C\uC740 \uB3D9\uC6B0\uC0B0\uC5C5(\uC8FC) \uC628\uB77C\uC778 \uC6F9 \uCE74\uD0C8\uB85C\uADF8 \uC2DC\uC2A4\uD15C\uC5D0\uC11C \uC790\uB3D9\uC73C\uB85C \uBC1C\uC1A1\uB41C \uC54C\uB9BC \uBA54\uC77C\uC785\uB2C8\uB2E4.
\uC0C1\uB2F4 \uCC98\uB9AC \uBC0F \uAD00\uB9AC\uB294 \uAD00\uB9AC\uC790 CMS \uC2DC\uC2A4\uD15C(\uB610\uB294 DB)\uC744 \uD655\uC778\uD574 \uC8FC\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4.
  `;
  const mailHtml = `
    <div style="font-family: 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-top: 0;">\u{1F4E8} \uB3D9\uC6B0\uC0B0\uC5C5(\uC8FC) \uC2E0\uADDC \uACE0\uAC1D \uBB38\uC758 \uC54C\uB9BC</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">\uB3D9\uC6B0\uC0B0\uC5C5 \uC628\uB77C\uC778 \uC6F9 \uCE74\uD0C8\uB85C\uADF8\uC5D0 \uC0C8\uB85C\uC6B4 \uAE30\uC220\uC0C1\uB2F4 \uBC0F \uC790\uBB38/\uC790\uB8CC\uC694\uCCAD \uBB38\uC758\uAC00 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
        <tr style="background-color: #f8fafc;">
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; width: 30%; font-weight: bold;">\uC774\uB984/\uC5C5\uCCB4\uBA85</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${name}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">\uC5F0\uB77D\uCC98</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #0284c7;">${phone}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">\uD68C\uC2E0 \uC774\uBA54\uC77C</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${email || "\uBBF8\uC785\uB825"}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">\uC5C5\uBB34 \uBD84\uB958</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;"><span style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${type}</span></td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">\uACF5\uAC1C \uC5EC\uBD80</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${isPrivate ? '<strong style="color: #ef4444;">\uBE44\uACF5\uAC1C (\uC81C\uBAA9\uB9CC \uB178\uCD9C)</strong>' : '<strong style="color: #22c55e;">\uACF5\uAC1C (\uC804\uCCB4 \uB178\uCD9C)</strong>'}</td>
        </tr>
        <tr>
          <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">\uC811\uC218 \uC77C\uC790</th>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${date}</td>
        </tr>
      </table>
      
      <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h4 style="margin: 0 0 8px 0; color: #ea580c; font-size: 14px;">\uC81C\uBAA9: ${title}</h4>
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${content}</p>
      </div>
      
      <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        \uBCF8 \uBA54\uC77C\uC740 \uB3D9\uC6B0\uC0B0\uC5C5(\uC8FC) \uC628\uB77C\uC778 \uC6F9 \uCE74\uD0C8\uB85C\uADF8 \uC2DC\uC2A4\uD15C\uC5D0\uC11C \uC790\uB3D9\uC73C\uB85C \uBC1C\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.<br />
        \uC0C1\uB2F4 \uC0C1\uC138 \uAD00\uB9AC \uBC0F \uB2F5\uBCC0 \uCC98\uB9AC\uB294 \uAD00\uB9AC\uC790 CMS \uC2DC\uC2A4\uD15C\uC5D0\uC11C \uC9C4\uD589\uD574 \uC8FC\uC2ED\uC2DC\uC624.
      </p>
    </div>
  `;
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = import_nodemailer.default.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
          // Prevents certificate chain validation failures
        }
      });
      await transporter.sendMail({
        from: smtpFrom,
        to: recipient,
        subject,
        text: mailText,
        html: mailHtml
      });
      console.log(`[Email Sent] Success sending email to ${recipient}`);
      return res.json({ success: true, message: "\uBA54\uC77C \uBC1C\uC1A1 \uC644\uB8CC!" });
    } catch (error) {
      console.error("[Email Error] Failed to send email via SMTP:", error);
      return res.status(500).json({
        success: false,
        error: "SMTP \uBA54\uC77C \uBC1C\uC1A1\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
        details: error.message,
        loggedText: mailText
      });
    }
  } else {
    console.log("=========================================");
    console.log("[SMTP \uBBF8\uC124\uC815] \uC54C\uB9BC \uC774\uBA54\uC77C \uC2DC\uBBAC\uB808\uC774\uC158 \uB85C\uADF8:");
    console.log(`To: ${recipient}`);
    console.log(`Subject: ${subject}`);
    console.log(mailText);
    console.log("=========================================");
    return res.json({
      success: true,
      simulated: true,
      message: "SMTP \uC815\uBCF4\uAC00 \uC124\uC815\uB418\uC5B4 \uC788\uC9C0 \uC54A\uC544, \uBB38\uC758 \uB0B4\uC6A9\uC774 \uC11C\uBC84 \uC2DC\uC2A4\uD15C \uB85C\uADF8\uC5D0 \uC548\uC804\uD558\uAC8C \uAE30\uB85D \uBC0F \uC2DC\uBBAC\uB808\uC774\uC158\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC2E4\uC81C \uC774\uBA54\uC77C\uC744 \uBC1C\uC1A1\uD558\uB824\uBA74 secrets \uD639\uC740 \uAD00\uB9AC\uC790 CMS\uC758 \uC774\uBA54\uC77C \uC124\uC815\uC744 \uD1B5\uD574 SMTP \uC815\uBCF4\uB97C \uB4F1\uB85D\uD574 \uC8FC\uC138\uC694.",
      loggedText: mailText
    });
  }
});
app.post("/api/reply-inquiry", async (req, res) => {
  const { name, email, title, content, answer } = req.body;
  if (!email) {
    return res.status(400).json({ error: "\uD68C\uC2E0\uC744 \uBCF4\uB0BC \uACE0\uAC1D\uC758 \uC774\uBA54\uC77C \uC8FC\uC18C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." });
  }
  const emailSettings = await getEmailSettings();
  const smtpHost = emailSettings?.smtpHost || process.env.SMTP_HOST;
  const smtpPort = parseInt(emailSettings?.smtpPort?.toString() || process.env.SMTP_PORT || "587");
  const smtpUser = emailSettings?.smtpUser || process.env.SMTP_USER;
  const smtpPass = emailSettings?.smtpPass || process.env.SMTP_PASS;
  const smtpFrom = emailSettings?.smtpFrom || process.env.SMTP_FROM || smtpUser || "no-reply@doongwoo.net";
  const subject = `[\uB3D9\uC6B0\uC0B0\uC5C5] \uBB38\uC758\uD558\uC2E0 \uB0B4\uC6A9\uC5D0 \uB300\uD55C \uACF5\uC2DD \uB2F5\uBCC0\uC774 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`;
  const mailText = `
\uC548\uB155\uD558\uC138\uC694, ${name}\uB2D8.
\uB3D9\uC6B0\uC0B0\uC5C5(\uC8FC) \uB3C4\uB85C\uC548\uC804\uC2DC\uC124\uBB3C \uC628\uB77C\uC778 \uCE74\uD0C8\uB85C\uADF8\uB97C \uC774\uC6A9\uD574 \uC8FC\uC154\uC11C \uC9C4\uC2EC\uC73C\uB85C \uAC10\uC0AC\uB4DC\uB9BD\uB2C8\uB2E4.
\uACE0\uAC1D\uB2D8\uAED8\uC11C \uB0A8\uACA8\uC8FC\uC2E0 \uAE30\uC220/\uACAC\uC801\uBB38\uC758\uC5D0 \uB300\uD55C \uAC80\uD1A0 \uB2F5\uBCC0\uC744 \uC544\uB798\uC640 \uAC19\uC774 \uC548\uB0B4\uD574 \uB4DC\uB9BD\uB2C8\uB2E4.

\u25A0 \uBB38\uC758 \uC81C\uBAA9: ${title}

\u25A0 \uC0C1\uC138 \uBB38\uC758 \uB0B4\uC6A9:
${content}

--------------------------------------------------
\u25A0 \uB3D9\uC6B0\uC0B0\uC5C5(\uC8FC) \uB2F4\uB2F9 \uBD80\uC11C \uACF5\uC2DD \uD68C\uC2E0 \uB0B4\uC6A9:
${answer}
--------------------------------------------------

\uCD94\uAC00 \uBB38\uC758\uC0AC\uD56D\uC740 \uACE0\uAC1D\uC13C\uD130 \uB300\uD45C\uBC88\uD638 031-965-1133\uC73C\uB85C \uC5F0\uB77D\uD574 \uC8FC\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4.
\uAC10\uC0AC\uD569\uB2C8\uB2E4.

\uB3D9\uC6B0\uC0B0\uC5C5(\uC8FC) \uB4DC\uB9BC.
  `;
  const mailHtml = `
    <div style="font-family: 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-top: 0;">\u2709\uFE0F \uB3D9\uC6B0\uC0B0\uC5C5(\uC8FC) \uBB38\uC758 \uB2F5\uBCC0 \uC548\uB0B4</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">\uC548\uB155\uD558\uC138\uC694, <strong>${name}</strong>\uB2D8.</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">\uB3D9\uC6B0\uC0B0\uC5C5(\uC8FC) \uB3C4\uB85C\uC548\uC804\uC2DC\uC124\uBB3C \uC628\uB77C\uC778 \uCE74\uD0C8\uB85C\uADF8\uB97C \uC774\uC6A9\uD574 \uC8FC\uC154\uC11C \uC9C4\uC2EC\uC73C\uB85C \uAC10\uC0AC\uB4DC\uB9BD\uB2C8\uB2E4.<br>\uC2E0\uCCAD\uD574 \uC8FC\uC2E0 \uAE30\uC220\uBB38\uC758/\uACAC\uC801\uBB38\uC758\uC5D0 \uB300\uD55C \uB2F4\uB2F9 \uAE30\uC220\uBD80\uC11C\uC758 \uACF5\uC2DD \uAC80\uD1A0 \uB2F5\uBCC0\uC744 \uC544\uB798\uC640 \uAC19\uC774 \uC548\uB0B4\uD574 \uB4DC\uB9BD\uB2C8\uB2E4.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 0 0 5px 0; font-size: 11px; color: #94a3b8; font-weight: bold;">\uBB38\uC758 \uC81C\uBAA9</p>
        <p style="margin: 0 0 15px 0; font-size: 13px; color: #1e293b; font-weight: bold;">${title}</p>
        <p style="margin: 0 0 5px 0; font-size: 11px; color: #94a3b8; font-weight: bold;">\uC0C1\uC138 \uBB38\uC758 \uB0B4\uC6A9</p>
        <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5; white-space: pre-wrap;">${content}</p>
      </div>
      
      <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #ea580c; font-size: 14px; font-weight: bold;">\uB3D9\uC6B0\uC548\uC804 \uB2F4\uB2F9 \uAE30\uC220\uBD80\uC11C \uACF5\uC2DD \uD68C\uC2E0 \uB0B4\uC6A9</h3>
        <p style="margin: 0; font-size: 13px; color: #1c1917; line-height: 1.6; white-space: pre-wrap; font-weight: bold;">${answer}</p>
      </div>
      
      <p style="font-size: 13px; color: #475569; line-height: 1.6;">\uCD94\uAC00\uC801\uC73C\uB85C \uAD81\uAE08\uD558\uC2E0 \uADDC\uACA9 \uB3C4\uBA74\uC5D0 \uB300\uD55C \uAE30\uC220 \uC790\uBB38 \uBC0F \uC218\uB7C9\uBCC4 \uB3C4\uB9E4 \uB2E8\uAC00 \uACAC\uC801\uC740 \uACE0\uAC1D\uC13C\uD130 \uB300\uD45C\uBC88\uD638 <b>031-965-1133</b>\uC73C\uB85C \uC804\uD654 \uC8FC\uC2DC\uBA74 \uB354\uC6B1 \uCE5C\uC808\uD558\uACE0 \uC2E0\uC18D\uD788 \uC0C1\uB2F4\uD574 \uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.</p>
      
      <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        \uBCF8 \uBA54\uC77C\uC740 \uB3D9\uC6B0\uC0B0\uC5C5(\uC8FC) \uC628\uB77C\uC778 \uC6F9 \uCE74\uD0C8\uB85C\uADF8 \uC2DC\uC2A4\uD15C\uC5D0\uC11C \uC791\uC131\uD55C \uB2F5\uBCC0\uC744 \uBC14\uD0D5\uC73C\uB85C \uC790\uB3D9 \uC804\uC1A1\uB41C \uBC1C\uC1A1\uC804\uC6A9 \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4.<br>
        Copyright \xA9 Dongwoo Industry Co., Ltd. All Rights Reserved.
      </p>
    </div>
  `;
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = import_nodemailer.default.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject,
        text: mailText,
        html: mailHtml
      });
      console.log(`[Reply Sent] Success sending reply email to inquirer: ${email}`);
      return res.json({ success: true, message: "\uD68C\uC2E0 \uC774\uBA54\uC77C \uBC1C\uC1A1 \uC644\uB8CC!" });
    } catch (error) {
      console.error("[Reply Email Error] Failed to send email via SMTP:", error);
      return res.status(500).json({
        success: false,
        error: "SMTP \uBA54\uC77C \uBC1C\uC1A1\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
        details: error.message,
        loggedText: mailText
      });
    }
  } else {
    console.log("=========================================");
    console.log("[SMTP \uBBF8\uC124\uC815] \uD68C\uC2E0 \uC774\uBA54\uC77C \uC2DC\uBBAC\uB808\uC774\uC158 \uB85C\uADF8:");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(mailText);
    console.log("=========================================");
    return res.json({
      success: true,
      simulated: true,
      message: "SMTP \uC815\uBCF4\uAC00 \uC124\uC815\uB418\uC5B4 \uC788\uC9C0 \uC54A\uC544, \uBB38\uC758 \uD68C\uC2E0 \uB2F5\uBCC0 \uB0B4\uC6A9\uC774 \uC11C\uBC84 \uB85C\uADF8\uC5D0 \uAE30\uB85D \uBC0F \uC2DC\uBBAC\uB808\uC774\uC158\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC2E4\uC81C \uC774\uBA54\uC77C\uC744 \uBC1C\uC1A1\uD558\uB824\uBA74 secrets \uD639\uC740 \uAD00\uB9AC\uC790 CMS\uC758 \uC774\uBA54\uC77C \uC124\uC815\uC744 \uD1B5\uD574 SMTP \uC815\uBCF4\uB97C \uB4F1\uB85D\uD574 \uC8FC\uC138\uC694.",
      loggedText: mailText
    });
  }
});
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages array." });
  }
  if (!ai) {
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let mockResponse = "\uD604\uC7AC AI \uC11C\uBE44\uC2A4 \uD0A4\uAC00 \uC124\uC815\uB418\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBB38\uC758\uC0AC\uD56D\uC740 '\uACE0\uAC1D\uC13C\uD130 > \uBB38\uC758\uD558\uAE30' \uBA54\uB274\uB97C \uC774\uC6A9\uD558\uC2DC\uAC70\uB098 031-965-1133\uC73C\uB85C \uC5F0\uB77D\uC8FC\uC2DC\uBA74 \uCE5C\uC808\uD788 \uC548\uB0B4\uD574 \uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.";
    if (lastUserMessage.includes("\uBCFC\uB77C\uB4DC")) {
      mockResponse = "\uB3D9\uC6B0\uC548\uC804\uC758 \uB300\uD45C \uBCFC\uB77C\uB4DC\uB294 '\uACE0\uC815\uC2DD \uC2A4\uD2F8 \uBCFC\uB77C\uB4DC(DW-S100)'\uC640 '\uACE0\uD0C4\uC131 \uC6B0\uB808\uD0C4 \uBCFC\uB77C\uB4DC(DW-U80)', '\uACE0\uAE09 \uD654\uAC15\uC11D \uC11D\uC7AC \uBCFC\uB77C\uB4DC(DW-G250)'\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uC6A9\uB3C4\uC5D0 \uB9DE\uAC8C \uC120\uD0DD\uD558\uC5EC \uBE44\uAD50\uD574\uBCF4\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
    } else if (lastUserMessage.includes("\uB3C4\uBA74") || lastUserMessage.includes("\uB2E4\uC6B4\uB85C\uB4DC")) {
      mockResponse = "\uC81C\uD488 \uB3C4\uBA74(DWG) \uBC0F \uCE74\uD0C8\uB85C\uADF8(PDF) \uC790\uB8CC\uB294 '\uC81C\uD488\uC18C\uAC1C \uC0C1\uC138\uD398\uC774\uC9C0' \uD639\uC740 '\uAE30\uC220\uC790\uB8CC > \uB2E4\uC6B4\uB85C\uB4DC \uC13C\uD130'\uC5D0\uC11C \uBB34\uB8CC\uB85C \uB2E4\uC6B4\uB85C\uB4DC \uBC1B\uC73C\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
    }
    return res.json({ response: mockResponse });
  }
  try {
    const systemInstruction = `
You are the AI Sales and Technical Representative for "DONGWOO" (\uB3D9\uC6B0\uC548\uC804), Korea's leading road safety facilities online catalog.
Your goal is to assist construction managers, engineers, sales representatives, and public officials in finding the perfect road safety products (bollards, signs, lane separators, fences, etc.).

Here is our catalog data:
1. "\uACE0\uC815\uC2DD \uC2A4\uD2F8 \uBCFC\uB77C\uB4DC (DW-S100)": Made of carbon steel pipe. Size: \xD8101.6 x 3.2t. Height: 850mm. Features: Hot-dip galvanized & powder coated. Installation: Concrete anchor fixing. Perfect for heavy-duty protection.
2. "\uACE0\uD0C4\uC131 \uC6B0\uB808\uD0C4 \uBCFC\uB77C\uB4DC (DW-U80)": Made of flexible polyurethane. Size: \xD8150 x 800H. Height: 800mm. Features: Perfect self-recovery after crash, shock absorption. Installation: Anchor/embedded. Excellent for car damage minimization.
3. "\uACE0\uAE09 \uD654\uAC15\uC11D \uC11D\uC7AC \uBCFC\uB77C\uB4DC (DW-G250)": Made of natural granite stone. Size: \xD8250 x 700H. Height: 700mm. Elegant texture, semi-permanent durability.
4. "\uACE0\uD718\uB3C4 \uB3C4\uB85C \uC548\uB0B4 \uD45C\uC9C0\uD310": Aluminum plate + ASTM high-intensity reflective sheet. Exceptional night visibility. Sizing is custom.
5. "\uC6B0\uB808\uD0C4 \uBB34\uB2E8\uD6A1\uB2E8\uAE08\uC9C0 \uCC28\uC120\uBD84\uB9AC\uB300": Polyethylene + urethane joint. 2000L x 150W x 900H. Reduces pedestrian crash rates.

Instructions:
- Always answer in Korean politely, unless the user queries in English.
- Be highly professional, helpful, and technically accurate.
- Suggest appropriate products based on user needs (e.g., if they ask for crash resistance, recommend Steel; if they ask for car protection, recommend Urethane; for landscaping, recommend Granite).
- Keep answers concise and easy to read. Mention that CAD drawing and PDF downloads are available in the catalog.
`;
    const chatHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));
    const currentMsg = messages[messages.length - 1].content;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: currentMsg }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1e3
      }
    });
    res.json({ response: response.text });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "Gemini API failed to process request.", details: err.message });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted.");
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
    console.log("Serving production build from dist.");
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
