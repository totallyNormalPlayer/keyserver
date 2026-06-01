const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

const KEYS_FILE = "./keys.json";
const EXPIRATION_MS = 6 * 60 * 60 * 1000; // 6 hours

function loadKeys() {
    try {
        return JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));
    } catch (e) {
        return {};
    }
}

function saveKeys(keys) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

function generateKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "BZ";
    for (let i = 0; i < 3; i++) {
        key += "-";
        for (let j = 0; j < 4; j++) {
            key += chars[Math.floor(Math.random() * chars.length)];
        }
    }
    return key;
}

// ===================== MAIN PAGE =====================
app.get("/", (req, res) => {
    res.send(`
        <h1>✅ Budokai Z Key System</h1>
        <p>Server is running correctly.</p>
        <p><strong>Use /getkey?hwid=xxx</strong> to generate keys.</p>
    `);
});

// ===================== GET KEY =====================
app.get("/getkey", (req, res) => {
    const hwid = req.query.hwid;

    if (!hwid) {
        return res.status(400).json({ error: "No HWID provided" });
    }

    const keys = loadKeys();

    for (const [key, data] of Object.entries(keys)) {
        if (data.hwid === hwid && Date.now() < data.expiresAt) {
            return res.json({
                success: true,
                key: key,
                message: "You already have an active key"
            });
        }
    }

    const newKey = generateKey();
    
    keys[newKey] = {
        hwid: hwid,
        created: Date.now(),
        expiresAt: Date.now() + EXPIRATION_MS
    };

    saveKeys(keys);

    res.json({
        success: true,
        key: newKey,
        expiresIn: "6 hours"
    });
});

// ===================== VALIDATE =====================
app.get("/validate", (req, res) => {
    const { key, hwid } = req.query;

    if (!key || !hwid) {
        return res.json({ valid: false, reason: "Missing key or hwid" });
    }

    const keys = loadKeys();
    const entry = keys[key];

    if (!entry) {
        return res.json({ valid: false, reason: "Invalid key" });
    }

    if (Date.now() > entry.expiresAt) {
        delete keys[key];
        saveKeys(keys);
        return res.json({ valid: false, reason: "Key has expired" });
    }

    if (entry.hwid !== hwid) {
        return res.json({ valid: false, reason: "This key belongs to another device" });
    }

    res.json({ valid: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Budokai Z Key System Running on Port ${PORT}`);
});
