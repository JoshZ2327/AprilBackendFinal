const express = require('express');
const router = express.Router();

// Mock portfolio data (replace with a database or in-memory store if needed)
let portfolio = [
    { token: 'SOL', balance: 25 },
    { token: 'USDC', balance: 1000 },
    { token: 'ETH', balance: 1.5 }
];

// Endpoint to retrieve the portfolio
router.get('/', (req, res) => {
    if (portfolio.length === 0) {
        return res.status(404).json({ message: 'Portfolio is empty' });
    }
    res.json(portfolio);
});

// Endpoint to get the balance of a specific token
router.get('/:token', (req, res) => {
    const { token } = req.params;
    const tokenData = portfolio.find(item => item.token.toUpperCase() === token.toUpperCase());

    if (!tokenData) {
        return res.status(404).json({ message: `No balance found for token: ${token}` });
    }
    res.json(tokenData);
});

// Endpoint to add a new token to the portfolio
router.post('/', (req, res) => {
    const { token, balance } = req.body;

    // Validate input
    if (!token || balance === undefined) {
        return res.status(400).json({ message: 'Invalid request. Token and balance are required.' });
    }

    // Check if the token already exists
    const existingToken = portfolio.find(item => item.token.toUpperCase() === token.toUpperCase());
    if (existingToken) {
        return res.status(400).json({ message: `Token ${token} already exists in the portfolio.` });
    }

    // Add the new token
    portfolio.push({ token: token.toUpperCase(), balance });
    res.status(201).json({ message: 'Token added successfully', portfolio });
});

// Endpoint to update the balance of an existing token
router.put('/:token', (req, res) => {
    const { token } = req.params;
    const { balance } = req.body;

    // Validate input
    if (balance === undefined) {
        return res.status(400).json({ message: 'Invalid request. Balance is required.' });
    }

    // Find the token in the portfolio
    const tokenData = portfolio.find(item => item.token.toUpperCase() === token.toUpperCase());

    if (!tokenData) {
        return res.status(404).json({ message: `Token ${token} not found in the portfolio.` });
    }

    // Update the balance
    tokenData.balance = balance;
    res.json({ message: `Balance for ${token} updated successfully`, portfolio });
});

// Endpoint to remove a token from the portfolio
router.delete('/:token', (req, res) => {
    const { token } = req.params;

    // Find the index of the token in the portfolio
    const tokenIndex = portfolio.findIndex(item => item.token.toUpperCase() === token.toUpperCase());

    if (tokenIndex === -1) {
        return res.status(404).json({ message: `Token ${token} not found in the portfolio.` });
    }

    // Remove the token
    portfolio.splice(tokenIndex, 1);
    res.json({ message: `Token ${token} removed successfully`, portfolio });
});

module.exports = router;
