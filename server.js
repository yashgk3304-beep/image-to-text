// Run: node server.js   (Node 18+, no npm install needed)
const http = require("http");
const fs = require("fs");
const path = require("path");

// ============================================================
// 👉 PASTE YOUR NVIDIA API KEY BETWEEN THE QUOTES BELOW
//    It looks like: nvapi-xxxxxxxxxxxxxxxxxxxxxxxx
//    Get one at https://build.nvidia.com
//    Never upload this file to GitHub with your key inside!
// ============================================================
const KEY = "";

// ============================================================
// 👉 (OPTIONAL) CHANGE THE VISION MODEL HERE
//    Any vision model name from build.nvidia.com works.
// ============================================================
const MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

const URL_ = "https://integrate.api.nvidia.com/v1/chat/completions";
const PORT = 3000;

if (!KEY) {
  console.error("No API key found. Open server.js and paste your key into const KEY = \"\";");
  process.exit(1);
}

const send = (res, code, obj) => {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
};

http
  .createServer((req, res) => {
    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(fs.readFileSync(path.join(__dirname, "index.html")));
    }

    if (req.method === "POST" && req.url === "/api/describe") {
      let body = "";
      req.on("data", (c) => {
        body += c;
        if (body.length > 2e6) req.destroy(); // 2 MB cap
      });
      req.on("end", async () => {
        try {
          const { image, prompt } = JSON.parse(body);
          const r = await fetch(URL_, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${KEY}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              model: MODEL,
              max_tokens: 8192, // reasoning models spend tokens "thinking" first
              reasoning_budget: 2048, // lower = faster, higher = more careful
              temperature: 0.6,
              top_p: 0.95,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt || "Describe this image in detail." },
                    { type: "image_url", image_url: { url: image } },
                  ],
                },
              ],
            }),
          });
          const data = await r.json();
          if (!r.ok) return send(res, r.status, { error: data.detail || data.error || data });
          const msg = data.choices[0].message;
          send(res, 200, { text: msg.content || "(Model returned no answer. Try raising max_tokens.)" });
        } catch (e) {
          send(res, 500, { error: String(e) });
        }
      });
      return;
    }

    res.writeHead(404);
    res.end();
  })
  .listen(PORT, () => console.log(`Open http://localhost:${PORT}  (model: ${MODEL})`));
