const getDashboardStats = async (req, res) => {
    try {
        // Abhi AI models connected nahi hain,
        // isliye initial dashboard statistics.

        const stats = {
            totalEvents: 0,
            threatsDetected: 0,
            highRisk: 0,
            criticalThreats: 0
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load dashboard statistics"
        });
    }
};

module.exports = {
    getDashboardStats
};