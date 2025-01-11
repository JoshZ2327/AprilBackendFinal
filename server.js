const express = require('express');
const app = express();

// Middleware for parsing JSON
app.use(express.json());

const tradeRoute = require('./api/trade');
const portfolioRoute = require('./api/portfolio');

// Routes
app.use('/api/trade', tradeRoute);
app.use('/api/portfolio', portfolioRoute);

// Root endpoint
app.get('/', (req, res) => {
    res.send('Backend is working!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
