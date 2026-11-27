const path = require("path");
const express = require("express");
const crypto = require("crypto");
const { sendToSupport } = require("./support");

const app = express();
const PORT = process.env.PORT || 3000;

const TIMESTAMP_SECRET = process.env.TIMESTAMP_SECRET;

if (!TIMESTAMP_SECRET) {
  throw new Error("TIMESTAMP_SECRET is not configured.");
}

function createTimestampSignature(formLoadedAt) {
  return crypto
    .createHmac("sha256", TIMESTAMP_SECRET)
    .update(String(formLoadedAt))
    .digest("hex");
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  express.static(path.join(__dirname, "..", "public"), {
    extensions: ["html"],
  }),
);

app.get("/contact-timestamp", (req, res) => {
  const formLoadedAt = Date.now();

  const signature = createTimestampSignature(formLoadedAt);

  res.json({ formLoadedAt, signature });
});

app.post("/contact", (req, res) => {
  const name = (req.body.name || "").trim();
  const email = (req.body.email || "").trim();
  const message = (req.body.message || "").trim();
  const website = (req.body.website || "").trim();

  // Honeypot check
  if (website) {
    return res.json({ ok: true });
  }

  const formLoadedAt = req.body.formLoadedAt;
  const signature = req.body.signature;

  if (
  !Number.isFinite(formLoadedAt) ||
  typeof signature !== "string"
  ) {
  return res.json({ ok: true });
  }

  if (!/^[0-9a-f]{64}$/i.test(signature)) {
  return res.json({ ok: true });
  }

  const expectedSignature = createTimestampSignature(formLoadedAt);

  const receivedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  const signaturesMatch = crypto.timingSafeEqual(
  receivedBuffer,
  expectedBuffer
  );

  if (!signaturesMatch) {
  return res.json({ ok: true });
  }

  const elapsedTime = Date.now() - formLoadedAt;

  if (elapsedTime < 3000) {
    return res.json({ ok: true });
  }

  // Required field validation
  if (!name || !email || !message) {
    return res.status(400).json({
      ok: false,
      error: "Please fill in your name, email and message.",
    });
  }

  sendToSupport({ name, email, message });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Calico Media site running at http://localhost:${PORT}`);
});
