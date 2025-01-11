const express = require('express');
const axios = require('axios');
const {
    Connection,
    clusterApiUrl,
    PublicKey,
    Transaction,
    SystemProgram
} = require('@solana/web3.js');
const router = express.Router();

// Solana Connection
const connection = new Connection(clusterApiUrl('mainnet-beta'));

// In-Memory State
let isTradingActive = false;
const activeTrades = [];
let tradingInterval = null; // Holds the trading loop interval

// Fetch Wallet Token Balances
async function fetchWalletTokens(walletAddress) {
    try {
        const publicKey = new PublicKey(walletAddress);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // SPL Token program ID
        });
        return tokenAccounts.value.map((account) => {
            const data = account.account.data.parsed.info;
            return {
                mint: data.mint,
                balance: parseFloat(data.tokenAmount.uiAmount)
            };
        });
    } catch (error) {
        console.error('Error fetching wallet tokens:', error.message);
        throw new Error('Failed to fetch wallet tokens.');
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

        return quotes.map((quote) => ({
            price: quote.outAmount / 10 ** 6,
            liquidity: quote.liquidity
        }));
    } catch (error) {
        console.error('Error fetching price data:', error.message);
        throw error;
    }
}

// Determine the Best Strategy
function determineBestStrategy(priceData) {
    const prices = priceData.map((data) => data.price);
    const shortMA = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const longMA = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const currentPrice = prices[prices.length - 1];

    const isTrending = Math.abs(shortMA - longMA) / longMA > 0.01;
    const isReverting = currentPrice > longMA * 0.97 && currentPrice < longMA * 1.03;
    const isBreakingOut = currentPrice > Math.max(...prices.slice(-10)) || currentPrice < Math.min(...prices.slice(-10));

    if (isTrending) return "trendFollowing";
    if (isReverting) return "meanReversion";
    if (isBreakingOut) return "breakout";
    return "HOLD";
}

// Automated Trading Loop
async function automatedTrading(walletAddress, inputMint, outputMint) {
    console.log("Starting automated trading...");
    tradingInterval = setInterval(async () => {
        if (!isTradingActive) return; // Exit if trading is inactive

        try {
            const walletTokens = await fetchWalletTokens(walletAddress);
            const inputToken = walletTokens.find((token) => token.mint === inputMint);
            if (!inputToken || inputToken.balance <= 0) {
                console.log(`Insufficient balance for ${inputMint}. Skipping trade.`);
                return;
            }

            const priceData = await fetchPriceData(inputMint, outputMint);
            const bestStrategy = determineBestStrategy(priceData);
            if (bestStrategy === "HOLD") {
                console.log("No favorable strategy. Holding position.");
                return;
            }

            console.log(`Executing trade with strategy: ${bestStrategy}`);
            const tradeAmount = inputToken.balance * 0.05;
            console.log(`Trading ${tradeAmount} of ${inputMint} to ${outputMint}.`);
        } catch (error) {
            console.error('Error during trading loop:', error.message);
        }
    }, 10000);
}

// Start Trading Endpoint
router.post('/start-automation', async (req, res) => {
    const { walletAddress, inputMint, outputMint } = req.body;

    console.log("Start automation request received:");
    console.log("Wallet Address:", walletAddress);
    console.log("Input Mint:", inputMint);
    console.log("Output Mint:", outputMint);

    if (!walletAddress || !inputMint || !outputMint) {
        console.error("Missing parameters in request.");
        return res.status(400).json({ message: 'Missing required parameters.' });
    }

    try {
        const tokens = await fetchWalletTokens(walletAddress);
        console.log("Wallet Tokens:", tokens);

        const tradingLoop = await automatedTrading(walletAddress, inputMint, outputMint);
        console.log("Automated trading loop started.");
        res.json({ message: 'Automated trading started successfully.' });
    } catch (error) {
        console.error("Error starting automated trading:", error.message);
        res.status(500).json({ message: 'Failed to start automated trading.', error: error.message });
    }
});

// Stop Trading Endpoint
router.post('/stop-automation', (req, res) => {
    if (!isTradingActive) {
        return res.status(400).json({ message: 'Trading is not active.' });
    }

    clearInterval(tradingInterval);
    tradingInterval = null;
    isTradingActive = false;
    console.log("Automated trading stopped.");
    res.json({ message: 'Automated trading stopped successfully.' });
});

module.exports = router;
