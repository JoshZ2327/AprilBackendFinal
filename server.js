const express = require('express');
const dotenv = require('dotenv');

// Import routes
const portfolioRoutes = require('./routes/portfolio');
const tradeRoutes = require('./routes/trade');
const strategyRoutes = require('./routes/strategy');
const statusRoutes = require('./routes/status');
const logsRoutes = require('./routes/logs');
const tokensRoutes = require('./routes/tokens');
const configRoutes = require('./routes/config');
const executeRoutes = require('./routes/execute');
const quoteRoutes = require('./routes/quote');

// Initialize app
dotenv.config();
const app = express();
app.use(express.json());

// Define routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/tokens', tokensRoutes);
app.use('/api/config', configRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/quote', quoteRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Backend is running' });
});

// Global error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
