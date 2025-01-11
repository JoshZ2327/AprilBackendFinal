const dotenv = require('dotenv');

// Load environment variables from a .env file if available
dotenv.config();

const config = {
    RPC_URL: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
    JUPITER_API: process.env.JUPITER_API || 'https://quote-api.jup.ag/v4/quote',
    DEFAULT_GAS_RESERVE: process.env.DEFAULT_GAS_RESERVE || 0.01, // Add default gas reserve as an environment variable
    STOP_LOSS_PERCENTAGE: process.env.STOP_LOSS_PERCENTAGE || 0.01 // Add stop-loss percentage as configurable
};

module.exports = config;
