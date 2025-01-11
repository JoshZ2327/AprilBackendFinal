const express = require('express');
const router = express.Router();

// Dummy portfolio endpoint
router.get('/', (req, res) => {
    res.json([
        { token: 'SOL', balance: 25 },
        { token: 'USDC', balance: 1000 },
        { token: 'ETH', balance: 1.5 }
    ]);
});

module.exports = router;
