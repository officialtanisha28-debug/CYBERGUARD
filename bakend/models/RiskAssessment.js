
const mongoose = require("mongoose");

const riskAssessmentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true
        },

        eventId: {
            type: String,
            required: true,
            unique: true
        },

        threatType: {
            type: String,
            required: true,
            trim: true
        },

        source: {
            type: String,
            required: true,
            trim: true
        },

        phishingProbability: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        deepfakeProbability: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        anomalyProbability: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        overallRiskScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        riskLevel: {
            type: String,
            required: true,
            enum: ["SAFE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
        },

        indicators: {
            type: [String],
            default: []
        },

        recommendedAction: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "RiskAssessment",
    riskAssessmentSchema
);
