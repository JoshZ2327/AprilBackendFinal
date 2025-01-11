const dotenv = require('dotenv');

// Load environment variables from a .env file if available
dotenv.config();

// Configuration object
const config = {
    RPC_URL: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
    JUPITER_API: process.env.JUPITER_API || 'https://quote-api.jup.ag/v4/quote',
    DEFAULT_GAS_RESERVE: parseFloat(process.env.DEFAULT_GAS_RESERVE) || 0.01, // Ensure it's parsed as a float
    STOP_LOSS_PERCENTAGE: parseFloat(process.env.STOP_LOSS_PERCENTAGE) || 0.01 // Ensure it's parsed as a float
};

module.exports = config;
