export default function handler(req, res) {
    try {
        console.log("Trade endpoint hit");
        res.status(200).json({ message: "Trade endpoint is working" });
    } catch (error) {
        console.error("Error in trade.js:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
