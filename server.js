const express = require('express');
const dotenv = require('dotenv');

// Import route files
const portfolioRoutes = require('./routes/portfolio');
const tradeRoutes = require('./routes/trade'); // Add trade route
// Add other route imports as needed

dotenv.config();

const app = express();
app.use(express.json());

// Define routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/trade', tradeRoutes); // Link trade route
// Add other routes similarly

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Backend is running' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
