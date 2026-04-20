const axios = require('axios');

/**
 * Flowshield AI - Node.js SDK (Base v1.0.0)
 * Institutional-grade financial fraud detection for startups.
 */
class FlowshieldClient {
    constructor(apiKey, options = {}) {
        if (!apiKey) {
            throw new Error("Flowshield: API Key is required for initialization.");
        }
        this.apiKey = apiKey;
        this.baseUrl = options.baseUrl || "https://api.flowshield.ai/api/v1";
        this.timeout = options.timeout || 5000;
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                "X-API-Key": this.apiKey,
                "Content-Type": "application/json",
                "X-SDK-Platform": "node_js",
                "X-SDK-Version": "1.0.0"
            },
            timeout: this.timeout
        });
    }

    /**
     * Analyze a single transaction for fraud risk.
     * @param {Object} transactionData - High-fidelity transaction metadata.
     * @returns {Promise<Object>} Risk scoring and decision vectors.
     */
    async analyze(transactionData) {
        try {
            const response = await this.client.post('/transactions/analyze', transactionData);
            return response.data;
        } catch (error) {
            this._handleError(error);
        }
    }

    _handleError(error) {
        if (error.response) {
            const { status, data } = error.response;
            throw new Error(`Flowshield API Error [${status}]: ${data.message || JSON.stringify(data)}`);
        }
        throw new Error(`Flowshield Network Error: ${error.message}`);
    }
}

module.exports = FlowshieldClient;
