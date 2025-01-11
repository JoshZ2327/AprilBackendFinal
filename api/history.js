const express = require('express');
const router = express.Router();

// Mock trade history data (to be replaced with real database or in-memory storage)
let tradeHistory = [
    { token: 'SOL', action: 'buy', amount: 10, date: '2023-01-01' },
    { token: 'USDC', action: 'sell', amount: 100, date: '2023-01-02' }
];

// Endpoint to get all trade history
router.get('/', (req, res) => {
    if (tradeHistory.length === 0) {
        return res.status(404).json({ message: 'No trade history available' });
    }
    res.json(tradeHistory);
});

// Endpoint to filter trade history by token
router.get('/:token', (req, res) => {
    const { token } = req.params;
    const filteredHistory = tradeHistory.filter(trade => trade.token.toUpperCase() === token.toUpperCase());

    if (filteredHistory.length === 0) {
        return res.status(404).json({ message: `No trade history found for token: ${token}` });
    }
    res.json(filteredHistory);
});

// Endpoint to add a new trade to the history (for testing or manual entry)
router.post('/', (req, res) => {
    const { token, action, amount, date } = req.body;

    // Validate input
    if (!token || !action || !amount || !date) {
        return res.status(400).json({ message: 'Invalid request. Token, action, amount, and date are required.' });
    }

    // Add trade to history
    const newTrade = { token, action, amount, date };
    tradeHistory.push(newTrade);

    res.status(201).json({ message: 'Trade added successfully', trade: newTrade });
});

module.exports = router;
