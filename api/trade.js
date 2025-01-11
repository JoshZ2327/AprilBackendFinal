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
                amount: 1 * 10 ** 6 // Simulate fetching price for 1 unit of input token
            }
        });
        const quotes = response.data.data;

        if (!quotes || quotes.length === 0) {
            throw new Error('No price data available');
        }

        // Extract price data from quotes
        return quotes.map((quote) => quote.outAmount / 10 ** 6); // Convert smallest unit to base unit
    } catch (error) {
        console.error('Error fetching price data:', error.message);
        throw error;
    }
}

// Endpoint to execute trades with strategies, portfolio size trades, and 3% stop-loss
router.post('/', async (req, res) => {
    const { strategy = 'trendFollowing', walletAddress } = req.body;

    // Validate input
    if (!strategy || !walletAddress) {
        return res.status(400).json({ message: 'Strategy and walletAddress are required.' });
    }

    try {
        // Fetch the user's wallet tokens
        const walletTokens = await fetchWalletTokens(walletAddress);
        console.log('Wallet Tokens:', walletTokens);

        // Determine input token and fetch its balance
        const inputToken = strategy === 'trendFollowing' ? 'USDC' : 'SOL'; // Example token selection logic
        const inputTokenAccount = walletTokens.find((token) => token.mint === inputToken);
        if (!inputTokenAccount) {
            return res.status(400).json({ message: `Input token (${inputToken}) not found in wallet.` });
        }

        // Calculate trade amount (5% of portfolio size)
        const portfolioSize = inputTokenAccount.balance;
        const tradeAmount = portfolioSize * 0.05; // 5% of the portfolio
        if (tradeAmount <= 0) {
            return res.status(400).json({ message: 'Insufficient balance for trade.' });
        }

        // Fetch real-time price data for the trade
        const priceData = await fetchPriceData('USDC', 'SOL');
        const entryPrice = priceData[priceData.length - 1]; // Current price

        // Set stop-loss price (3% below entry price)
        const stopLossPrice = entryPrice * 0.97;

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
        } else {
            return res.status(400).json({ message: 'Invalid strategy selected.' });
        }

        if (action === 'HOLD') {
            return res.json({ message: 'No trade executed. Strategy indicates HOLD.' });
        }

        // Determine trade details
        const outputToken = action === 'BUY' ? 'SOL' : 'USDC';

        // Fetch a trade quote from the Jupiter API
        const quoteResponse = await axios.get('https://quote-api.jup.ag/v4/quote', {
            params: {
                inputMint: inputToken,
                outputMint: outputToken,
                amount: Math.floor(tradeAmount * 10 ** 6), // Convert to smallest unit
                slippage: 1 // 1% slippage tolerance
            }
        });

        const quote = quoteResponse.data;

        if (!quote.data || quote.data.length === 0) {
            return res.status(404).json({ message: 'No trade routes found for the specified pair.' });
        }

        // Create a transaction for the trade
        const bestRoute = quote.data[0];
        const transaction = new Transaction();
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(walletAddress),
                toPubkey: new PublicKey(bestRoute.outMint),
                lamports: Math.floor(tradeAmount * 10 ** 9)
            })
        );

        // Serialize the transaction for signing by Phantom Wallet
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false
        });

        // Send the serialized transaction back to the frontend for signing
        res.json({
            message: 'Transaction created successfully.',
            serializedTransaction: serializedTransaction.toString('base64'),
            bestRoute,
            entryPrice,
            stopLossPrice
        });
    } catch (error) {
        console.error('Error executing trade:', error.message);
        res.status(500).json({ message: 'An error occurred during trade execution.', error: error.message });
    }
});

module.exports = router;
