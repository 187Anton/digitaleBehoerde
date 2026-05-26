const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend der Digitalen Behoerde laeuft.");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "digitale-behoerde-backend"
  });
});

app.listen(PORT, () => {
  console.log(`Backend laeuft auf Port ${PORT}`);
});
