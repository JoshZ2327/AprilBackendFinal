const fetch = require('node-fetch'); // Ensure you have this dependency installed
const express = require('express');
const router = express.Router();

// Helper function to simulate strategy application
function applyStrategy(strategy) {
    switch (strategy) {
        case 'trendFollowing':
            return {
                action: 'BUY',
                token: 'SOL',
                amount: 1, // Simulated trade amount
            };
        case 'meanReversion':
            return {
                action: 'SELL',
                token: 'ETH',
                amount: 0.5, // Simulated trade amount
            };
        case 'breakout':
            return {
                action: 'BUY',
                token: 'BTC',
                amount: 0.1, // Simulated trade amount
            };
        default:
            return null;
    }
}

// Simulate a trade execution
async function executeTrade(tradeParams, walletAddress) {
    console.log('[INFO] Executing trade for walletAddress:', walletAddress);
    // Simulate trade logic (use external APIs here for real trades)
    return {
        success: true,
        walletAddress,
        executedTrade: tradeParams,
        timestamp: new Date(),
    };
}

async function fetchPrice(token) {
    const API_URL = `https://quote-api.jup.ag/v4/quote?outputMint=${token}`;
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        return data?.bestQuote?.price || null;
    } catch (error) {
        console.error('[ERROR] Failed to fetch price:', error.message);
        return null;
    }
}

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
        const { strategy, walletAddress, stopLossPercentage = 1 } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                error: 'Bad Request',
                details: '"walletAddress" is required.',
            });
        }

        // Use default strategy if none provided
        const selectedStrategy = strategy || 'trendFollowing';

        console.log(`[INFO] Received request for walletAddress: ${walletAddress}, strategy: ${selectedStrategy}`);

        // Apply strategy to determine trade parameters
        const tradeParams = applyStrategy(selectedStrategy);

        if (!tradeParams) {
            return res.status(400).json({
                error: 'Invalid Strategy',
                details: `The strategy '${selectedStrategy}' is not recognized.`,
            });
        }

        console.log('[INFO] Strategy applied:', tradeParams);

        // Fetch price data for the token
        const tokenPrice = await fetchPrice(tradeParams.token);
        if (!tokenPrice) {
            return res.status(500).json({
                error: 'Price Fetch Failed',
                details: `Failed to fetch price for token: ${tradeParams.token}.`,
            });
        }

        console.log(`[INFO] Fetched price for ${tradeParams.token}: $${tokenPrice}`);

        // Simulate trade execution
        const tradeResult = await executeTrade(tradeParams, walletAddress);

        console.log('[INFO] Trade executed successfully:', tradeResult);

        // Stop-loss check simulation
        const stopLossLimit = tokenPrice * (1 - stopLossPercentage / 100);
        console.log(`[INFO] Stop-loss limit for ${tradeParams.token}: $${stopLossLimit}`);

        // Return success response
        return res.status(200).json({
            message: 'Trade executed successfully.',
            details: tradeResult,
            tokenPrice,
            stopLossLimit,
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
