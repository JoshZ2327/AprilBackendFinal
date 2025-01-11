module.exports = {
    /**
     * Logs a message with a timestamp.
     * @param {string} message - The message to log.
     */
    logWithTimestamp: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    },

    /**
     * Formats a number to a fixed number of decimal places.
     * @param {number} value - The number to format.
     * @param {number} decimals - Number of decimal places (default: 2).
     * @returns {string} - Formatted number as a string.
     */
    formatNumber: (value, decimals = 2) => {
        return parseFloat(value).toFixed(decimals);
    },

    /**
     * Validates if the given token symbol is supported.
     * @param {string} token - The token symbol to validate.
     * @param {Array<string>} supportedTokens - List of supported tokens.
     * @returns {boolean} - True if the token is supported, false otherwise.
     */
    isValidToken: (token, supportedTokens) => {
        return supportedTokens.includes(token.toUpperCase());
    },

    /**
     * Calculates the percentage difference between two numbers.
     * @param {number} value1 - The first number.
     * @param {number} value2 - The second number.
     * @returns {number} - Percentage difference.
     */
    calculatePercentageDifference: (value1, value2) => {
        if (value2 === 0) return 0;
        return ((value1 - value2) / value2) * 100;
    },

    /**
     * Delays execution for a specified time.
     * @param {number} ms - Time in milliseconds to delay.
     * @returns {Promise} - Resolves after the specified time.
     */
    delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms))
};
