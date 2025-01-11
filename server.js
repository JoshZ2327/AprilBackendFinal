const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logs HTTP requests

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the April Trading Software API', status: 'Healthy' });
});

// API Routes
const portfolioRoute = require('./api/portfolio');
const tradeRoute = require('./api/trade');
const historyRoute = require('./api/history');

app.use('/api/portfolio', portfolioRoute);
app.use('/api/trade', tradeRoute);
app.use('/api/history', historyRoute);

// 404 Error handling
app.use((req, res, next) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack); // Log error stack for debugging
    res.status(500).json({ message: 'An internal server error occurred', error: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; // For testing or further integration
