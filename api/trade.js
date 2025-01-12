const { getJupiterQuote } = require('./services/jupiterService');
const { executeTrade } = require('./services/tradeExecution');
const { applyStrategy } = require('./services/strategyService');

module.exports = async function handler(req, res) {
    try {
        // Ensure the request method is POST
        if (req.method !== 'POST') {
            return res.status(405).json({
                error: 'Method Not Allowed',
                details: 'Only POST requests are supported.',
            });
        }

        // Extract and validate required fields from the request body
        const { strategy, walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                error: 'Bad Request',
                details: '"walletAddress" is required.',
            });
        }

        console.log(`[INFO] Received request for walletAddress: ${walletAddress}, strategy: ${strategy || 'default'}`);

        // Use default strategy if not provided
        const selectedStrategy = strategy || 'trendFollowing';

        // Apply the strategy logic
        const strategyParams = await applyStrategy(selectedStrategy);
        if (!strategyParams) {
            return res.status(500).json({
                error: 'Strategy Error',
                details: `Failed to apply strategy: ${selectedStrategy}`,
            });
        }

        console.log('[INFO] Strategy parameters:', strategyParams);

        // Fetch trade quote from Jupiter API
        const quote = await getJupiterQuote(strategyParams);
        if (!quote) {
            return res.status(500).json({
                error: 'Quote Error',
                details: 'Failed to fetch trade quote from Jupiter API.',
            });
        }

        console.log('[INFO] Fetched quote:', quote);

        // Execute the trade
        const tradeResult = await executeTrade(walletAddress, quote);
        if (!tradeResult.success) {
            return res.status(500).json({
                error: 'Trade Execution Error',
                details: tradeResult.error || 'Failed to execute trade.',
            });
        }

        console.log('[INFO] Trade executed successfully:', tradeResult);

        // Send success response
        return res.status(200).json({
            message: 'Trade executed successfully.',
            tradeDetails: tradeResult,
        });
    } catch (error) {
        console.error('[ERROR] Unexpected error:', error);

        // Catch and log unexpected errors
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.message || 'An unexpected error occurred.',
        });
    }
};
