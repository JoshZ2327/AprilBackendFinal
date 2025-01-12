module.exports = {
    /**
     * Logs a message with a timestamp.
     * @param {string} message - The message to log.
     * @param {'INFO' | 'WARN' | 'ERROR'} level - Log level (default: 'INFO').
     */
    logWithTimestamp: (message, level = 'INFO') => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level}] ${message}`);
    },

    /**
     * Formats a number to a fixed number of decimal places.
     * @param {number} value - The number to format.
     * @param {number} decimals - Number of decimal places (default: 2).
     * @returns {string} - Formatted number as a string, or an error message if invalid input.
     */
    formatNumber: (value, decimals = 2) => {
        if (isNaN(value)) {
            console.warn(`[WARN] Invalid value passed to formatNumber: ${value}`);
            return 'Invalid number';
        }
        return parseFloat(value).toFixed(decimals);
    },

    /**
     * Validates if the given token symbol is supported.
     * @param {string} token - The token symbol to validate.
     * @param {Array<string>} supportedTokens - List of supported tokens.
     * @returns {boolean} - True if the token is supported, false otherwise.
     */
    isValidToken: (token, supportedTokens) => {
        if (!token || !Array.isArray(supportedTokens)) {
            console.warn('[WARN] Invalid input to isValidToken');
            return false;
        }
        return supportedTokens.includes(token.toUpperCase());
    },

    /**
     * Calculates the percentage difference between two numbers.
     * @param {number} value1 - The first number.
     * @param {number} value2 - The second number.
     * @returns {number} - Percentage difference, or NaN if invalid inputs.
     */
    calculatePercentageDifference: (value1, value2) => {
        if (isNaN(value1) || isNaN(value2)) {
            console.warn('[WARN] Invalid numbers passed to calculatePercentageDifference');
            return NaN;
        }
        if (value2 === 0) return 0;
        return ((value1 - value2) / value2) * 100;
    },

    /**
     * Delays execution for a specified time.
     * @param {number} ms - Time in milliseconds to delay.
     * @returns {Promise} - Resolves after the specified time.
     */
    delay: async (ms) => {
        if (isNaN(ms) || ms < 0) {
            console.warn(`[WARN] Invalid delay time: ${ms}`);
            return Promise.resolve();
        }
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
