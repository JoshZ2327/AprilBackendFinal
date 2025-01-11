const express = require('express');
const router = express.Router();

// Dummy trade history endpoint
router.get('/', (req, res) => {
    res.json([
        { token: 'SOL', action: 'buy', amount: 10, date: '2023-01-01' },
        { token: 'USDC', action: 'sell', amount: 100, date: '2023-01-02' }
    ]);
});

module.exports = router;
