
"use strict";

// =====================================
// DASHBOARD AUTH CHECK
// =====================================

const token = localStorage.getItem("token");
const userData = localStorage.getItem("user");

// =====================================
// REDIRECT IF NOT LOGGED IN
// =====================================

if (!token || !userData) {
    window.location.href = "login.html";
} else {

    // =====================================
    // LOAD USER INFORMATION
    // =====================================

    function loadUserInfo() {
        try {
            const user = JSON.parse(userData);

            if (!user || !user.name || !user.email) {
                throw new Error("Invalid user data");
            }

            const userName = document.getElementById("userName");
            const userEmail = document.getElementById("userEmail");
            const welcomeName = document.getElementById("welcomeName");

            if (userName) userName.textContent = user.name;
            if (userEmail) userEmail.textContent = user.email;
            if (welcomeName) welcomeName.textContent = user.name;

        } catch (error) {
            console.error("User data error:", error);

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "login.html";
        }
    }

    // =====================================
    // LOAD DASHBOARD STATISTICS
    // =====================================

    async function loadDashboardStats() {
        try {
            const response = await fetch(
                "http://localhost:5000/api/dashboard/stats",
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success || !data.stats) {
                throw new Error(
                    data.message || "Failed to load dashboard statistics"
                );
            }

            const stats = data.stats;

            const statElements = {
                totalEvents: document.getElementById("totalEvents"),
                threatsDetected: document.getElementById("threatsDetected"),
                highRisk: document.getElementById("highRisk"),
                criticalThreats: document.getElementById("criticalThreats")
            };

            for (const [key, element] of Object.entries(statElements)) {
                if (element) {
                    element.textContent =
                        Number(stats[key] ?? 0).toLocaleString();
                }
            }

        } catch (error) {
            console.error("Dashboard statistics error:", error);
        }
    }

    // =====================================
    // LOGOUT
    // =====================================

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "login.html";
        });
    }

    // =====================================
    // MODEL 4 RISK FUSION
    // =====================================

    const riskFusionForm = document.getElementById("riskFusionForm");
    const riskFusionStatus = document.getElementById("riskFusionStatus");
    const riskFusionResult = document.getElementById("riskFusionResult");
    const riskAssessBtn = document.getElementById("riskAssessBtn");

    if (riskFusionForm) {
        riskFusionForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const phishingInput =
                document.getElementById("phishingProbability");
            const deepfakeInput =
                document.getElementById("deepfakeProbability");
            const anomalyInput =
                document.getElementById("anomalyProbability");
            const threatTypeInput = document.getElementById("threatType");
            const sourceInput = document.getElementById("riskSource");

            const phishing = Number(phishingInput.value);
            const deepfake = Number(deepfakeInput.value);
            const anomaly = Number(anomalyInput.value);

            const probabilities = [
                { name: "Phishing", value: phishing, input: phishingInput },
                { name: "Deepfake", value: deepfake, input: deepfakeInput },
                { name: "Behaviour anomaly", value: anomaly, input: anomalyInput }
            ];

            for (const item of probabilities) {
                if (
                    item.input.value.trim() === "" ||
                    !Number.isFinite(item.value) ||
                    item.value < 0 ||
                    item.value > 100
                ) {
                    item.input.focus();

                    riskFusionStatus.textContent =
                        `${item.name} probability 0 se 100 ke beech honi chahiye.`;

                    riskFusionStatus.className =
                        "risk-fusion-status risk-status-error";

                    return;
                }
            }

            const threatType = threatTypeInput.value.trim();
            const source = sourceInput.value.trim();

            if (!threatType || !source) {
                riskFusionStatus.textContent =
                    "Threat type aur source dono bharna zaroori hai.";

                riskFusionStatus.className =
                    "risk-fusion-status risk-status-error";

                return;
            }

            const requestBody = {
                phishing_probability: phishing,
                deepfake_probability: deepfake,
                anomaly_probability: anomaly,
                threat_type: threatType,
                source: source,
                event_id: `CG-${Date.now()}`
            };

            riskAssessBtn.disabled = true;
            riskAssessBtn.textContent = "Assessing...";
            riskFusionStatus.textContent =
                "Model 4 se risk assessment chal raha hai...";

            riskFusionStatus.className = "risk-fusion-status";
            riskFusionResult.hidden = true;

            try {
                const response = await fetch(
                    "http://localhost:5000/api/ai/assess",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify(requestBody)
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success || !data.result) {
                    throw new Error(
                        data.message || "Risk assessment request failed."
                    );
                }

                const result = data.result;
                const score = Number(result.overall_risk_score);

                if (
                    !Number.isFinite(score) ||
                    score < 0 ||
                    score > 100
                ) {
                    throw new Error("Model 4 returned an invalid risk score.");
                }

                document.getElementById("riskScore").textContent =
                    score.toFixed(2).replace(/\.00$/, "");

                const riskLevel = document.getElementById("riskLevel");
                riskLevel.textContent = result.risk_level || "UNKNOWN";
                riskLevel.className =
                    "risk-level risk-level-" +
                    String(result.risk_level || "unknown").toLowerCase();

                document.getElementById("riskMeterFill").style.width =
                    `${score}%`;

                const indicatorsList =
                    document.getElementById("riskIndicators");

                indicatorsList.replaceChildren();

                const indicators = Array.isArray(result.indicators)
                    ? result.indicators
                    : ["No indicator details returned."];

                for (const indicator of indicators) {
                    const listItem = document.createElement("li");
                    listItem.textContent = String(indicator);
                    indicatorsList.appendChild(listItem);
                }

                document.getElementById("riskRecommendedAction").textContent =
                    result.recommended_action ||
                    "No recommendation returned.";

                document.getElementById("riskEventId").textContent =
                    `Event ID: ${result.event_id || requestBody.event_id}`;

                riskFusionResult.hidden = false;

                riskFusionStatus.textContent =
                    "Assessment complete. Result Model 4 se receive hua.";

                riskFusionStatus.className =
                    "risk-fusion-status risk-status-success";

            } catch (error) {
                console.error("Risk Fusion error:", error);

                riskFusionStatus.textContent =
                    `${error.message} Check karo ki Node.js backend aur Python Model 4 dono running hain.`;

                riskFusionStatus.className =
                    "risk-fusion-status risk-status-error";

            } finally {
                riskAssessBtn.disabled = false;
                riskAssessBtn.textContent = "Run Risk Assessment";
            }
        });
    }

    // =====================================
    // INITIALIZE DASHBOARD
    // =====================================

    loadUserInfo();
    loadDashboardStats();
}
