const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
const axios = require('axios');

const connection = new Connection(clusterApiUrl('mainnet-beta'));

export default async function handler(req, res) {
    try {
        // Validate the request
        const { strategy, walletAddress } = req.body;
        if (!strategy || !walletAddress) {
            return res.status(400).json({ error: "Missing 'strategy' or 'walletAddress'" });
        }

        console.log(`Trade endpoint hit with strategy: ${strategy} and wallet: ${walletAddress}`);

        // Fetch wallet tokens and balances
        const tokens = await fetchWalletTokens(walletAddress);
        console.log("Wallet Tokens:", tokens);

        if (tokens.length === 0) {
            return res.status(400).json({ error: "No tokens found in wallet" });
        }

        // Fetch price data from Jupiter
        const priceData = await fetchPriceData('USDC', 'SOL');
        console.log("Price Data:", priceData);

        if (priceData.length === 0) {
            return res.status(500).json({ error: "Failed to fetch price data" });
        }

        // Simulate trading logic
        const tradeDecision = applyStrategy(strategy, priceData);
        console.log(`Trade Decision: ${tradeDecision}`);

        if (tradeDecision === 'HOLD') {
            return res.status(200).json({ message: "Strategy indicates HOLD. No trade executed." });
        }

        // Execute trade (mock example)
        const tradeResult = await executeTrade(walletAddress, tradeDecision, tokens);
        console.log("Trade Result:", tradeResult);

        res.status(200).json({
            message: "Trade executed successfully",
            tradeResult,
        });
    } catch (error) {
        console.error("Error in trade.js:", error.message);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}

async function fetchWalletTokens(walletAddress) {
    try {
        const publicKey = new PublicKey(walletAddress);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token program ID
        });
        return tokenAccounts.value.map((account) => ({
            mint: account.account.data.parsed.info.mint,
            balance: parseFloat(account.account.data.parsed.info.tokenAmount.uiAmount),
        }));
    } catch (error) {
        console.error("Error fetching wallet tokens:", error.message);
        throw new Error("Failed to fetch wallet tokens.");
    }
}

async function fetchPriceData(inputMint, outputMint) {
    try {
        const response = await axios.get('https://quote-api.jup.ag/v4/quote', {
            params: {
                inputMint, // Replace with token mint address
                outputMint, // Replace with token mint address
                amount: 1 * 10 ** 6, // Simulate fetching price for 1 unit of input token
            },
        });
        const quotes = response.data.data;

        if (!quotes || quotes.length === 0) {
            throw new Error('No price data available');
        }

        return quotes.map((quote) => quote.outAmount / 10 ** 6); // Convert smallest unit to base unit
    } catch (error) {
        console.error("Error fetching price data:", error.message);
        throw new Error("Failed to fetch price data.");
    }
}

function applyStrategy(strategy, priceData) {
    const shortWindow = 5;
    const longWindow = 10;

    switch (strategy) {
        case 'trendFollowing':
            const shortMA = movingAverage(priceData.slice(-shortWindow));
            const longMA = movingAverage(priceData.slice(-longWindow));
            return shortMA > longMA ? 'BUY' : shortMA < longMA ? 'SELL' : 'HOLD';
        case 'meanReversion':
            const avgPrice = movingAverage(priceData.slice(-10));
            const currentPrice = priceData[priceData.length - 1];
            return currentPrice < avgPrice * 0.97 ? 'BUY' : currentPrice > avgPrice * 1.03 ? 'SELL' : 'HOLD';
        default:
            return 'HOLD';
    }
}

function movingAverage(data) {
    return data.reduce((a, b) => a + b, 0) / data.length;
}

async function executeTrade(walletAddress, tradeDecision, tokens) {
    // Mock implementation of trade execution
    return {
        success: true,
        tradeDetails: {
            walletAddress,
            decision: tradeDecision,
            tokensTraded: tokens,
        },
    };
}
