const express = require('express');
const axios = require('axios');
const router = express.Router();

// Mock Portfolio (Replace with a database in the future)
let portfolio = {
    USDC: 1000,
    SOL: 0
};

// Trading Strategies
class TradingStrategies {
    constructor(priceData) {
        this.priceData = priceData;
    }

    trendFollowing(shortWindow = 5, longWindow = 10) {
        const shortMA = this.movingAverage(this.priceData.slice(-shortWindow));
        const longMA = this.movingAverage(this.priceData.slice(-longWindow));
        if (shortMA > longMA) return "BUY";
        if (shortMA < longMA) return "SELL";
        return "HOLD";
    }

    meanReversion(window = 10, threshold = 0.03) {
        const movingAvg = this.movingAverage(this.priceData.slice(-window));
        const currentPrice = this.priceData[this.priceData.length - 1];
        if (currentPrice < movingAvg * (1 - threshold)) return "BUY";
        if (currentPrice > movingAvg * (1 + threshold)) return "SELL";
        return "HOLD";
    }

    breakout(breakoutWindow = 10) {
        const breakoutHigh = Math.max(...this.priceData.slice(-breakoutWindow));
        const breakoutLow = Math.min(...this.priceData.slice(-breakoutWindow));
        const currentPrice = this.priceData[this.priceData.length - 1];

        if (currentPrice > breakoutHigh) return "BUY";
        if (currentPrice < breakoutLow) return "SELL";
        return "HOLD";
    }

    adaptiveTrend(shortWindow = 5, longWindow = 10, threshold = 0.01) {
        const shortMA = this.movingAverage(this.priceData.slice(-shortWindow));
        const longMA = this.movingAverage(this.priceData.slice(-longWindow));
        const difference = Math.abs(shortMA - longMA) / longMA;

        if (shortMA > longMA && difference > threshold) return "BUY";
        if (shortMA < longMA && difference > threshold) return "SELL";
        return "HOLD";
    }

    movingAverage(data) {
        return data.reduce((a, b) => a + b, 0) / data.length;
    }
}

// Fetch Real-Time Price Data from Jupiter API
async function fetchPriceData(inputMint, outputMint) {
    try {
        const response = await axios.get('https://quote-api.jup.ag/v4/quote', {
            params: {
                inputMint,
                outputMint,
                amount: 1 * 10 ** 6 // Simulate fetching price for 1 unit of input token
            }
        });
        const quotes = response.data.data;

        if (!quotes || quotes.length === 0) {
            throw new Error('No price data available');
        }

        // Extract price data from quotes
        return quotes.map(quote => quote.outAmount / 10 ** 6); // Convert smallest unit to base unit
    } catch (error) {
        console.error('Error fetching price data:', error.message);
        throw error;
    }
}

// Endpoint to execute trades using strategies and Jupiter API
router.post('/', async (req, res) => {
    const { strategy = 'trendFollowing', amount } = req.body;

    // Validate input
    if (!strategy || !amount) {
        return res.status(400).json({ message: 'Strategy and amount are required.' });
    }

    try {
        // Fetch real-time price data for USDC → SOL
        const priceData = await fetchPriceData('USDC', 'SOL');

        // Initialize strategies with fetched price data
        const strategies = new TradingStrategies(priceData);

        // Decide action based on the selected strategy
        let action;
        if (strategy === 'trendFollowing') {
            action = strategies.trendFollowing();
        } else if (strategy === 'meanReversion') {
            action = strategies.meanReversion();
        } else if (strategy === 'breakout') {
            action = strategies.breakout();
        } else if (strategy === 'adaptiveTrend') {
            action = strategies.adaptiveTrend();
        } else {
            return res.status(400).json({ message: 'Invalid strategy selected.' });
        }

        if (action === 'HOLD') {
            return res.json({ message: 'No trade executed. Strategy indicates HOLD.', portfolio });
        }

        // Determine input and output tokens based on action
        const inputToken = action === 'BUY' ? 'USDC' : 'SOL';
        const outputToken = action === 'BUY' ? 'SOL' : 'USDC';

        // Validate portfolio balance
        if (portfolio[inputToken] < amount) {
            return res.status(400).json({ message: `Insufficient balance for ${inputToken}.` });
        }

        // Fetch a trade quote from the Jupiter API
        const quoteResponse = await axios.get('https://quote-api.jup.ag/v4/quote', {
            params: {
                inputMint: inputToken,
                outputMint: outputToken,
                amount: Math.floor(amount * 10 ** 6), // Convert to smallest unit
                slippage: 1 // 1% slippage tolerance
            }
        });

        const quote = quoteResponse.data;

        if (!quote.data || quote.data.length === 0) {
            return res.status(404).json({ message: 'No trade routes found for the specified pair.' });
        }

        // Simulate trade execution by updating the portfolio
        const bestQuote = quote.data[0];
        const outputAmount = bestQuote.outAmount / 10 ** 6; // Convert back to base units

        portfolio[inputToken] -= amount;
        portfolio[outputToken] = (portfolio[outputToken] || 0) + outputAmount;

        // Return trade execution details
        res.json({
            message: 'Trade executed successfully',
            strategy,
            action,
            inputToken,
            outputToken,
            inputAmount: amount,
            outputAmount,
            priceImpact: bestQuote.priceImpactPct,
            updatedPortfolio: portfolio
        });
    } catch (error) {
        console.error('Trade execution failed:', error);
        res.status(500).json({ message: 'An error occurred during trade execution.', error: error.message });
    }
});

module.exports = router;
