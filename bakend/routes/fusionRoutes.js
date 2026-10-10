
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const RiskAssessment = require("../models/RiskAssessment");
const protect = require("../middleware/authMiddleware");

const FUSION_API_URL = "http://127.0.0.1:8000/fusion";
const FUSION_HEALTH_URL = "http://127.0.0.1:8000/health";

const MODEL3B_API_URL = "http://127.0.0.1:8001/predict";
const MODEL3B_HEALTH_URL = "http://127.0.0.1:8001/health";

// --------------------------------------------------
// Model 4 health check
// GET /api/ai/health
// --------------------------------------------------
router.get("/health", async (req, res) => {
    try {
        const response = await fetch(FUSION_HEALTH_URL);
        const data = await response.json();

        if (!response.ok) {
            return res.status(502).json({
                success: false,
                message: "AI Fusion API is unavailable"
            });
        }

        return res.json({
            success: true,
            message: "CYBERGUARD backend connected to Model 4",
            aiService: data
        });
    } catch (error) {
        console.error("Model 4 health check failed:", error.message);

        return res.status(503).json({
            success: false,
            message:
                "Unable to connect to Model 4. Check whether the Python API is running."
        });
    }
});

// --------------------------------------------------
// Model 3B health check
// GET /api/ai/model3b/health
// --------------------------------------------------
router.get("/model3b/health", async (req, res) => {
    try {
        const response = await fetch(MODEL3B_HEALTH_URL);
        const data = await response.json();

        if (!response.ok) {
            return res.status(502).json({
                success: false,
                message: "Model 3B health check failed",
                details: data
            });
        }

        return res.json({
            success: true,
            message: "CYBERGUARD backend connected to Model 3B",
            aiService: data
        });
    } catch (error) {
        console.error("Model 3B health check failed:", error.message);

        return res.status(503).json({
            success: false,
            message:
                "Unable to connect to Model 3B. Check whether its API is running on port 8001."
        });
    }
});

// --------------------------------------------------
// Model 3B security-event prediction
// POST /api/ai/model3b/predict
// Authentication required
// --------------------------------------------------
router.post("/model3b/predict", protect, async (req, res) => {
    try {
        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid JSON security-event object is required."
            });
        }

        const response = await fetch(MODEL3B_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(req.body)
        });

        const result = await response.json();

        if (!response.ok) {
            return res.status(502).json({
                success: false,
                message: "Model 3B rejected the prediction request",
                details: result
            });
        }

        return res.json({
            success: true,
            message: "Model 3B prediction completed",
            result
        });
    } catch (error) {
        console.error("Model 3B prediction failed:", error.message);

        return res.status(503).json({
            success: false,
            message:
                "Unable to connect to Model 3B. Check whether its API is running on port 8001."
        });
    }
});

// --------------------------------------------------
// Model 4 risk assessment and MongoDB saving
// POST /api/ai/assess
// Authentication required
// --------------------------------------------------
router.post("/assess", protect, async (req, res) => {
    try {
        const {
            phishing_probability,
            deepfake_probability,
            anomaly_probability,
            threat_type,
            source,
            event_id
        } = req.body || {};

        const probabilities = [
            phishing_probability,
            deepfake_probability,
            anomaly_probability
        ];

        const invalidProbabilities = probabilities.some(value =>
            value === undefined ||
            value === null ||
            value === "" ||
            !Number.isFinite(Number(value)) ||
            Number(value) < 0 ||
            Number(value) > 100
        );

        if (invalidProbabilities) {
            return res.status(400).json({
                success: false,
                message:
                    "All probabilities must be numbers between 0 and 100."
            });
        }

        if (
            typeof threat_type !== "string" ||
            !threat_type.trim() ||
            typeof source !== "string" ||
            !source.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Threat type and source are required."
            });
        }

        const response = await fetch(FUSION_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                phishing_probability: Number(phishing_probability),
                deepfake_probability: Number(deepfake_probability),
                anomaly_probability: Number(anomaly_probability),
                threat_type: threat_type.trim(),
                source: source.trim(),
                event_id: event_id || `CG-${Date.now()}`
            })
        });

        const result = await response.json();

        if (!response.ok) {
            return res.status(502).json({
                success: false,
                message: "Model 4 rejected the assessment request",
                details: result
            });
        }

        if (!result.inputs) {
            return res.status(502).json({
                success: false,
                message:
                    "Model 4 returned an unexpected response. Assessment was not saved."
            });
        }

        const rawUserId = req.user?.id || req.user?._id;

        const userId =
            rawUserId && mongoose.isValidObjectId(rawUserId)
                ? rawUserId
                : undefined;

        const generatedEventId =
            result.event_id || event_id || `CG-${Date.now()}`;

        const assessment = new RiskAssessment({
            userId,
            eventId: generatedEventId,
            threatType: result.threat_type || threat_type.trim(),
            source: result.source || source.trim(),
            phishingProbability: result.inputs.phishing_probability,
            deepfakeProbability: result.inputs.deepfake_probability,
            anomalyProbability: result.inputs.anomaly_probability,
            overallRiskScore: result.overall_risk_score,
            riskLevel: result.risk_level,
            indicators: result.indicators || [],
            recommendedAction: result.recommended_action
        });

        await assessment.save();

        return res.status(201).json({
            success: true,
            message: "Risk assessment completed and saved to MongoDB.",
            result,
            savedAssessment: {
                id: assessment._id,
                eventId: assessment.eventId,
                riskLevel: assessment.riskLevel,
                overallRiskScore: assessment.overallRiskScore,
                createdAt: assessment.createdAt
            }
        });
    } catch (error) {
        console.error("Risk assessment error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "This event ID already exists. Run a new assessment to generate another event ID."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Assessment failed or could not be saved. Check the backend terminal."
        });
    }
});

module.exports = router;
