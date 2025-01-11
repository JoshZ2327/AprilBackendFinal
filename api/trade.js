const express = require('express');
const axios = require('axios');
const {
    Connection,
    clusterApiUrl,
    PublicKey,
    Transaction,
    SystemProgram,
} = require('@solana/web3.js');
const router = express.Router();

// Initialize Solana connection
const connection = new Connection(clusterApiUrl('mainnet-beta'));

// Automated trading state
let isTrading = false;

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
                amount: 1 * 10 ** 6, // Simulate fetching price for 1 unit of input token
            },
        });
        const quotes = response.data.data;

        if (!quotes || quotes.length === 0) {
            throw new Error('No price data available');
        }

        return quotes.map((quote) => quote.outAmount / 10 ** 6); // Convert smallest unit to base unit
    } catch (error) {
        console.error('Error fetching price data:', error.message);
        throw error;
    }
}

// Automated Trading Logic
async function executeTrading(walletAddress) {
    try {
        if (!isTrading) return;

        console.log('Fetching wallet tokens...');
        const publicKey = new PublicKey(walletAddress);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token program ID
        });

        const tokens = tokenAccounts.value.map((account) => {
            const data = account.account.data.parsed.info;
            return {
                mint: data.mint,
                balance: parseFloat(data.tokenAmount.uiAmount),
            };
        });

        // Find balances for USDC and SOL
        const usdcAccount = tokens.find((token) => token.mint === 'USDC_MINT_ADDRESS');
        const solAccount = tokens.find((token) => token.mint === 'SOL_MINT_ADDRESS');

        if (!usdcAccount || !solAccount) {
            console.error('USDC or SOL balance not found.');
            return;
        }

        const tradeAmount = usdcAccount.balance * 0.05;

        console.log('Fetching price data...');
        const priceData = await fetchPriceData('USDC', 'SOL');

        const strategies = new TradingStrategies(priceData);

        console.log('Determining best strategy...');
        let action;

        // Dynamically select best strategy based on price data
        const trendAction = strategies.trendFollowing();
        const meanReversionAction = strategies.meanReversion();
        const breakoutAction = strategies.breakout();

        // Prioritize actions: SELL > BUY > HOLD
        action =
            [trendAction, meanReversionAction, breakoutAction].find((a) => a === 'SELL') ||
            [trendAction, meanReversionAction, breakoutAction].find((a) => a === 'BUY') ||
            'HOLD';

        if (action === 'HOLD') {
            console.log('No trade executed. Strategy indicates HOLD.');
            return;
        }

        console.log('Fetching trade quote...');
        const response = await axios.get('https://quote-api.jup.ag/v4/quote', {
            params: {
                inputMint: 'USDC_MINT_ADDRESS',
                outputMint: 'SOL_MINT_ADDRESS',
                amount: Math.floor(tradeAmount * 10 ** 6),
                slippage: 1, // 1% slippage tolerance
            },
        });

        const quote = response.data;

        if (!quote.data || quote.data.length === 0) {
            console.error('No trade routes found.');
            return;
        }

        const bestRoute = quote.data[0];

        console.log('Executing trade...');
        console.log({
            action,
            tradeAmount,
            bestRoute,
        });

        // Repeat trading every 30 seconds
        setTimeout(() => executeTrading(walletAddress), 30000);
    } catch (error) {
        console.error('Error during trading:', error.message);
    }
}

// Start Automated Trading Automatically Upon Wallet Connection
router.post('/wallet-connected', (req, res) => {
    const { walletAddress } = req.body;

    if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required.' });
    }

    if (isTrading) {
        return res.status(400).json({ message: 'Trading is already running.' });
    }

    console.log('Wallet connected. Starting automated trading...');
    isTrading = true;
    executeTrading(walletAddress);
    res.json({ message: 'Automated trading started successfully upon wallet connection.' });
});

module.exports = router;
