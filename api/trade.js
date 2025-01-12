const { getJupiterQuote } = require('./services/jupiterService');
const { executeTrade } = require('./services/tradeExecution');
const { applyStrategy } = require('./services/strategyService'); // Add strategy logic

module.exports = async function handler(req, res) {
    try {
        // Ensure the request method is POST
        if (req.method !== 'POST') {
            return res.status(405).json({
                error: 'Method Not Allowed',
                details: 'Only POST requests are supported.',
            });
        }

        // Extract and validate required fields from request body
        const { strategy, walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                error: 'Bad Request',
                details: '"walletAddress" is a required field.',
            });
        }

        // Use a default strategy if none is provided
        const selectedStrategy = strategy || 'trendFollowing';
        console.log('Starting automated trading with strategy:', selectedStrategy);

        // Apply strategy logic to select tokens and trade parameters
        const strategyParams = await applyStrategy(selectedStrategy);
        if (!strategyParams) {
            return res.status(500).json({
                error: 'Strategy Error',
                details: 'Failed to apply the selected strategy. Please try again.',
            });
        }

        console.log('Strategy parameters:', strategyParams);

        // Fetch trade quote using Jupiter API
        const quote = await getJupiterQuote(strategyParams);
        if (!quote) {
            return res.status(500).json({
                error: 'Quote Error',
                details: 'Failed to fetch trade quote from Jupiter API.',
            });
        }

        console.log('Fetched quote:', quote);

        // Execute the trade using the fetched quote and walletAddress
        const tradeResult = await executeTrade(walletAddress, quote);
        if (!tradeResult.success) {
            return res.status(500).json({
                error: 'Trade Execution Error',
                details: tradeResult.error || 'Failed to execute trade. Please check your wallet and strategy.',
            });
        }

        console.log('Trade executed successfully:', tradeResult);

        // Send success response
        return res.status(200).json({
            message: 'Trade executed successfully.',
            details: tradeResult,
        });
    } catch (error) {
        console.error('Error handling trade request:', error);

        // Handle unexpected server errors
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.message,
        });
    }
};
