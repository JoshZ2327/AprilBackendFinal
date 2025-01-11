const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const tradeRoute = require('./trade'); // Import trade.js file
app.use('/api/trade', tradeRoute);

// Default route to confirm the backend is running
app.get('/', (req, res) => {
    res.send('Backend is running successfully.');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
