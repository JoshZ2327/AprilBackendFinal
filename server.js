const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Import your routes
const tradeRoute = require('./trade');
app.use('/api/trade', tradeRoute);

// Default route
app.get('/', (req, res) => {
    res.send('Backend is running successfully.');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
