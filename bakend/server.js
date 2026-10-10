
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const fusionRoutes = require("./routes/fusionRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", fusionRoutes);

// Debug: print all loaded AI routes
console.log(
    "CYBERGUARD AI routes:",
    fusionRoutes.stack
        .filter((layer) => layer.route)
        .map((layer) => {
            const methods = Object.keys(layer.route.methods)
                .map((method) => method.toUpperCase())
                .join(",");
            return `${methods} /api/ai${layer.route.path}`;
        })
);

// Serve frontend
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

// Start server
async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, "127.0.0.1", () => {
            console.log(
                `CYBERGUARD server running at http://127.0.0.1:${PORT}`
            );
        });
    } catch (error) {
        console.error("CYBERGUARD startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
