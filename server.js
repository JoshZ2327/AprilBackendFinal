const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' })); // Allow all origins
app.use(express.json());

// Import routes
const tradeRoute = require('./api/trade');
const portfolioRoute = require('./api/portfolio');
const historyRoute = require('./api/history');

// Define routes
app.use('/api/trade', tradeRoute);
app.use('/api/portfolio', portfolioRoute);
app.use('/api/history', historyRoute);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
