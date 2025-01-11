export default function handler(req, res) {
    try {
        console.log("Portfolio endpoint hit");
        console.log("Request Method:", req.method);
        console.log("Request Body:", req.body);
        res.status(200).json({ message: "Portfolio endpoint is working!" });
    } catch (error) {
        console.error("Error in Portfolio endpoint:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
