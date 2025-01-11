const express = require("express");
const TradingStrategies = require("./path/to/TradingStrategies"); // Adjust the path
const router = express.Router();

// Mock data
let portfolio = { USDC: 1000, SOL: 2.5 };
let tradeHistory = [];
let priceData = [100, 102, 101, 103, 105, 104, 106, 107, 105, 108, 109, 110]; // Replace with real API data

router.post("/", (req, res) => {
  const { strategy = "trendFollowing", amount = 50 } = req.body;

  // Ensure sufficient price data
  if (priceData.length < 20) {
    return res.status(400).json({ error: "Insufficient price data for strategies" });
  }

  // Initialize the trading strategy
  const strategies = new TradingStrategies(priceData);
  let decision;

  // Execute the selected strategy
  if (strategy === "trendFollowing") {
    decision = strategies.trendFollowing();
  } else if (strategy === "meanReversion") {
    decision = strategies.meanReversion();
  } else if (strategy === "breakout") {
    decision = strategies.breakout();
  } else {
    return res.status(400).json({ error: "Invalid strategy" });
  }

  // Handle trade decision
  let inputToken, outputToken;
  if (decision === "BUY") {
    inputToken = "USDC";
    outputToken = "SOL";
  } else if (decision === "SELL") {
    inputToken = "SOL";
    outputToken = "USDC";
  } else {
    return res.json({ decision: "HOLD", message: "No action taken" });
  }

  // Ensure sufficient balance for trade
  if (portfolio[inputToken] < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  // Execute trade (mock logic)
  portfolio[inputToken] -= amount;
  portfolio[outputToken] += amount * 1.01; // Simulated price increase

  // Record trade in history
  tradeHistory.push({
    timestamp: new Date().toISOString(),
    strategy,
    decision,
    inputToken,
    outputToken,
    amount,
  });

  return res.json({
    success: true,
    decision,
    inputToken,
    outputToken,
    portfolio,
  });
});

module.exports = router;
