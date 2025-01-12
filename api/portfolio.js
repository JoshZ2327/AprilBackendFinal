import fetch from "node-fetch"; // Ensure this is installed in your project

export default async function handler(req, res) {
    try {
        console.log("[INFO] Portfolio endpoint hit");

        // Ensure the request method is POST
        if (req.method !== "POST") {
            return res.status(405).json({
                error: "Method Not Allowed",
                details: "Only POST requests are supported.",
            });
        }

        // Extract walletAddress from the request body
        const { walletAddress } = req.body;

        if (!walletAddress) {
            console.warn("[WARN] Missing walletAddress in request body");
            return res.status(400).json({
                error: "Bad Request",
                details: '"walletAddress" is required in the request body.',
            });
        }

        console.log(`[INFO] Received walletAddress: ${walletAddress}`);

        // Simulate retrieving portfolio data for the wallet
        const portfolioData = {
            walletAddress,
            tokens: [
                { token: "SOL", balance: 10 },
                { token: "ETH", balance: 2 },
                { token: "BTC", balance: 0.5 },
            ],
            lastUpdated: new Date().toISOString(),
        };

        console.log("[INFO] Returning portfolio data:", portfolioData);

        // Return the portfolio data
        return res.status(200).json({
            message: "Portfolio data retrieved successfully!",
            portfolio: portfolioData,
        });
    } catch (error) {
        console.error("[ERROR] Unexpected error in Portfolio endpoint:", error);

        // Return a fallback error response
        return res.status(500).json({
            error: "Internal Server Error",
            details: error.message || "An unexpected error occurred.",
        });
    }
}
