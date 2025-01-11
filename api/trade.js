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
const activeTrades = []; // Tracks active trades and stop-loss monitoring

// Fetch Wallet Token Balances
async function fetchWalletTokens(walletAddress) {
    try {
        const publicKey = new PublicKey(walletAddress);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // SPL Token program ID
        });
        const tokens = tokenAccounts.value.map((account) => {
            const data = account.account.data.parsed.info;
            return {
                mint: data.mint,
                balance: parseFloat(data.tokenAmount.uiAmount)
            };
        });
        return tokens;
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

        // Extract price data from quotes
        return quotes.map((quote) => ({
            price: quote.outAmount / 10 ** 6, // Convert smallest unit to base unit
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

    // Analyze price trends and volatility
    const isTrending = Math.abs(shortMA - longMA) / longMA > 0.01; // If short MA deviates from long MA by > 1%
    const isReverting = currentPrice > longMA * 0.97 && currentPrice < longMA * 1.03; // Within 3% of long MA
    const isBreakingOut = currentPrice > Math.max(...prices.slice(-10)) || currentPrice < Math.min(...prices.slice(-10)); // New high/low

    // Choose the best strategy
    if (isTrending) return "trendFollowing";
    if (isReverting) return "meanReversion";
    if (isBreakingOut) return "breakout";

    return "HOLD"; // Default if no clear signal
}

// Automated Trading with Best Strategy
async function automatedTrading(walletAddress, inputMint, outputMint) {
    console.log("Starting automated trading...");

    const interval = setInterval(async () => {
        try {
            // Fetch wallet tokens and validate balance
            const walletTokens = await fetchWalletTokens(walletAddress);
            const inputTokenAccount = walletTokens.find((token) => token.mint === inputMint);
            if (!inputTokenAccount || inputTokenAccount.balance <= 0) {
                console.log(`Insufficient balance for token ${inputMint}. Skipping trade.`);
                return;
            }

            // Fetch price data from Jupiter
            const priceData = await fetchPriceData(inputMint, outputMint);
            const bestStrategy = determineBestStrategy(priceData);

            if (bestStrategy === "HOLD") {
                console.log("No favorable trading strategy. Holding position.");
                return;
            }

            console.log(`Best strategy determined: ${bestStrategy}`);

            // Execute trade based on the best strategy
            const currentPrice = priceData[priceData.length - 1].price;
            const tradeAmount = inputTokenAccount.balance * 0.05; // 5% of portfolio
            const transaction = new Transaction();
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(walletAddress),
                    toPubkey: new PublicKey(outputMint), // Replace with actual mint address
                    lamports: Math.floor(tradeAmount * 10 ** 9) // Example amount in lamports
                })
            );

            // Add stop-loss
            const stopLossPrice = bestStrategy === "trendFollowing" ? currentPrice * 0.97 : currentPrice * 1.03;
            activeTrades.push({ walletAddress, inputMint, outputMint, stopLossPrice });
            console.log(`Trade executed. Stop-loss price: ${stopLossPrice}`);
        } catch (error) {
            console.error("Error during automated trading:", error.message);
        }
    }, 10000); // Run every 10 seconds

    return interval;
}

// Stop-Loss Monitoring
async function monitorStopLoss() {
    console.log("Starting stop-loss monitoring...");
    setInterval(() => {
        activeTrades.forEach(async (trade, index) => {
            try {
                const priceData = await fetchPriceData(trade.inputMint, trade.outputMint);
                const currentPrice = priceData[priceData.length - 1].price;
                console.log(`Checking stop-loss for ${trade.inputMint}. Current price: ${currentPrice}, Stop-loss price: ${trade.stopLossPrice}`);

                if ((trade.inputMint === "BUY" && currentPrice <= trade.stopLossPrice) ||
                    (trade.inputMint === "SELL" && currentPrice >= trade.stopLossPrice)) {
                    console.log("Stop-loss triggered. Closing trade.");
                    activeTrades.splice(index, 1); // Remove trade from active list
                }
            } catch (error) {
                console.error("Error during stop-loss monitoring:", error.message);
            }
        });
    }, 5000); // Check every 5 seconds
}

// Endpoint to Start Automated Trading
router.post('/start-automation', async (req, res) => {
    const { walletAddress, inputMint, outputMint } = req.body;

    if (!walletAddress || !inputMint || !outputMint) {
        return res.status(400).json({ message: 'Missing required parameters.' });
    }

    try {
        const tradingLoop = await automatedTrading(walletAddress, inputMint, outputMint);
        res.json({ message: 'Automated trading started successfully.', tradingLoop });
    } catch (error) {
        console.error("Error starting automated trading:", error.message);
        res.status(500).json({ message: 'Failed to start automated trading.', error: error.message });
    }
});

// Start Stop-Loss Monitoring
monitorStopLoss();

module.exports = router;
