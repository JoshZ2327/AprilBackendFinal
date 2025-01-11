const express = require('express');
const router = express.Router();

// Dummy trade execution endpoint
router.post('/', (req, res) => {
    const { token, amount } = req.body;
    res.json({ success: true, token, amount });
});

module.exports = router;
