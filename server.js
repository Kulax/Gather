const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};
const allowedActions = new Set(["explain", "digest"]);
const allowedInterests = new Set(["Creativity", "Science", "Nature", "Design", "Culture", "Mindfulness", "Food"]);

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 16_384) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function createDemoReply({ action, title, summary, interests }) {
  const matchingInterests = interests.filter((interest) => summary.toLowerCase().includes(interest.toLowerCase()));
  if (action === "digest") {
    const lead = matchingInterests.length ? `With your interest in ${matchingInterests.slice(0, 2).join(" and ").toLowerCase()}, ` : "";
    return `${lead}today's stories share a lovely thread: curiosity starts with noticing. Explore one new idea, take a moment to look closer, and see what connections you find.`;
  }
  return `${title} is an invitation to look a little closer. ${summary} ${matchingInterests.length ? `It connects especially well with your interest in ${matchingInterests.join(" and ").toLowerCase()}.` : "Give it a try if the idea catches your eye."}`;
}

async function createGeminiReply(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { text: createDemoReply(payload), mode: "demo" };

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = payload.action === "digest"
    ? `Write a warm, concise personalized content digest in 2-3 sentences. Mention a unifying thread between the stories. The reader's interests are: ${payload.interests.join(", ") || "curiosity"}. Stories:\n${payload.summary}`
    : `In 2-3 clear, engaging sentences, help the reader understand why this story might be worth their time. Do not invent facts beyond the supplied summary. Reader interests: ${payload.interests.join(", ") || "curiosity"}. Title: ${payload.title}. Summary: ${payload.summary}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 220 },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error && data.error.message ? data.error.message : `Gemini returned HTTP ${response.status}.`;
    const error = new Error(message);
    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }
  const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts
    ? data.candidates[0].content.parts.map((part) => part.text || "").join("").trim()
    : "";
  if (!text) {
    const error = new Error("Gemini returned an empty response. Please try again.");
    error.status = 502;
    throw error;
  }
  return { text, mode: "gemini" };
}

async function handleAi(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Use POST for AI requests." });
  }
  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    return sendJson(response, error.message === "Request body is too large." ? 413 : 400, { error: error.message });
  }
  if (!payload || !allowedActions.has(payload.action)) return sendJson(response, 400, { error: "Choose a supported AI action." });
  if (typeof payload.summary !== "string" || payload.summary.trim().length < 1 || payload.summary.length > 8_000) {
    return sendJson(response, 400, { error: "A story summary between 1 and 8,000 characters is required." });
  }
  if (payload.action === "explain" && (typeof payload.title !== "string" || payload.title.trim().length < 1 || payload.title.length > 200)) {
    return sendJson(response, 400, { error: "A story title between 1 and 200 characters is required." });
  }
  const interests = Array.isArray(payload.interests)
    ? payload.interests.filter((interest) => typeof interest === "string" && allowedInterests.has(interest)).slice(0, 7)
    : [];
  try {
    const result = await createGeminiReply({ action: payload.action, title: payload.title || "", summary: payload.summary, interests });
    return sendJson(response, 200, result);
  } catch (error) {
    console.error("Gemini request failed:", error.message);
    return sendJson(response, error.status || 502, { error: error.status === 429 ? "Gemini is receiving too many requests. Please try again shortly." : "The AI service is unavailable right now. Please try again." });
  }
}

function serveFile(request, response) {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const route = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(root, `.${route}`);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }
  fs.readFile(filePath, (error, contents) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
      return response.end(error.code === "ENOENT" ? "Not found" : "Unable to read file");
    }
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    });
    response.end(contents);
  });
}

const server = http.createServer((request, response) => {
  if (request.url.startsWith("/api/ai")) return void handleAi(request, response);
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    return response.end("Method not allowed");
  }
  serveFile(request, response);
});

server.listen(port, () => {
  console.log(`Gather is running at http://localhost:${port}`);
  console.log(process.env.GEMINI_API_KEY ? "Gemini mode is enabled." : "Demo mode is enabled (set GEMINI_API_KEY to enable Gemini).");
});
