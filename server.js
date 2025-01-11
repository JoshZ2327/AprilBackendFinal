const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const tradeRoute = require('./api/trade'); // Ensure trade.js is in the /api folder

// Routes
app.use('/api/trade', tradeRoute);

// Default Route
app.get('/', (req, res) => {
    res.send('Backend is running successfully.');
});

// Start the Server (for local development)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export the app for serverless deployment (Vercel)
module.exports = app;
