module.exports = async function handler(req, res) {
    try {
        // Ensure the request method is POST
        if (req.method !== 'POST') {
            return res.status(405).json({
                error: 'Method Not Allowed',
                details: 'Only POST requests are supported.',
            });
        }

        // Check if the request body contains a walletAddress
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                error: 'Bad Request',
                details: '"walletAddress" is required.',
            });
        }

        console.log(`[INFO] Received request for walletAddress: ${walletAddress}`);

        // Return a simple success message
        return res.status(200).json({
            message: `Trade endpoint is working for wallet address: ${walletAddress}`,
        });
    } catch (error) {
        console.error('[ERROR] Unexpected error:', error);

        // Return a generic error response
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.message || 'An unexpected error occurred.',
        });
    }
};
