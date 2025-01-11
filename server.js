const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const portfolioRoute = require('./api/portfolio');
const tradeRoute = require('./api/trade');
const historyRoute = require('./api/history');

app.use('/api/portfolio', portfolioRoute);
app.use('/api/trade', tradeRoute);
app.use('/api/history', historyRoute);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
