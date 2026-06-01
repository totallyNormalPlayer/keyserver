const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

const KEYS_FILE = "./keys.json";

function loadKeys() {
    try {
        return JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));
    } catch {
        return {};
    }
}

function saveKeys(keys) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

function generateKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "KEY";
    for (let i = 0; i < 3; i++) {
        key += "-";
        for (let j = 0; j < 4; j++) {
            key += chars[Math.floor(Math.random() * chars.length)];
        }
    }
    return key;
}

app.get("/getkey", (req, res) => {
    const hwid = req.query.hwid;
    if (!hwid) return res.status(400).json({ error: "No HWID provided" });

    const keys = loadKeys();

    for (const [key, data] of Object.entries(keys)) {
        if (data.hwid === hwid) {
            return res.json({ key });
        }
    }

    const newKey = generateKey();
    keys[newKey] = { hwid, created: Date.now() };
    saveKeys(keys);

    return res.json({ key: newKey });
});

app.get("/validate", (req, res) => {
    const { key, hwid } = req.query;
    if (!key || !hwid) return res.status(400).json({ valid: false });

    const keys = loadKeys();
    const entry = keys[key];

    if (entry && entry.hwid === hwid) {
        return res.json({ valid: true });
    }

    return res.json({ valid: false });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Key server running on port " + PORT));
