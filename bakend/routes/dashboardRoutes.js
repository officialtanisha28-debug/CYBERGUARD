
const express = require("express");
const RiskAssessment = require("../models/RiskAssessment");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Dashboard statistics from MongoDB
router.get("/stats", protect, async (req, res) => {
    try {
        const totalEvents = await RiskAssessment.countDocuments();

        const threatsDetected = await RiskAssessment.countDocuments({
            riskLevel: {
                $in: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
            }
        });

        const highRisk = await RiskAssessment.countDocuments({
            riskLevel: {
                $in: ["HIGH", "CRITICAL"]
            }
        });

        const criticalThreats = await RiskAssessment.countDocuments({
            riskLevel: "CRITICAL"
        });

        return res.json({
            success: true,
            stats: {
                totalEvents,
                threatsDetected,
                highRisk,
                criticalThreats
            }
        });
    } catch (error) {
        console.error("Dashboard statistics error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load dashboard statistics."
        });
    }
});

// Recent risk assessment history
router.get("/history", protect, async (req, res) => {
    try {
        const assessments = await RiskAssessment.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select(
                "eventId threatType source phishingProbability deepfakeProbability anomalyProbability overallRiskScore riskLevel indicators recommendedAction createdAt"
            )
            .lean();

        return res.json({
            success: true,
            count: assessments.length,
            assessments
        });
    } catch (error) {
        console.error("Dashboard history error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load risk assessment history."
        });
    }
});

module.exports = router;
