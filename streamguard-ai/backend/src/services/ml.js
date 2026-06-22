/**
 * Flowshield AI Real-time Anomaly Scoring Engine
 */

/**
 * Calculates a transaction fraud risk probability score (0 to 100).
 * Replicates the Python scoring logic with location-risk heuristics.
 * @param {number} amount Transaction amount
 * @param {string} location Merchant/customer location
 * @param {string} userId User ID
 * @returns {number} Fraud score from 0.0 to 100.0
 */
export function calculateFraudRisk(amount, location, userId) {
  // Simple feature engineering matching python
  const amountLog = Math.log1p(amount);
  
  // Location anomaly risk heuristic
  let locationRisk = 0.1;
  if (amount > 1000) {
    locationRisk = 0.8;
  }
  
  // Custom Isolation Forest score simulation
  // Negative predict scores mean more anomalous
  // We approximate the score based on the engineered log amount and location risk features
  let simulatedScore = -0.55; // baseline normal
  
  if (amount > 5000) {
    simulatedScore = -0.95; // highly anomalous
  } else if (amount > 1000) {
    simulatedScore = -0.75; // moderately anomalous
  } else if (location && (location.toLowerCase() === 'unknown' || location.toLowerCase() === 'foreign')) {
    simulatedScore = -0.70; // suspicious location
  } else {
    // Normal transaction range
    simulatedScore = -0.45 - (Math.random() * 0.1);
  }

  // Normalize: Higher negative score -> higher risk (0-100)
  // Maps -1.0 to 100 and -0.4 to 0 as in Python: ((-score - 0.4) / 0.6) * 100
  let risk = ((-simulatedScore - 0.4) / 0.6) * 100;
  risk = Math.max(0, Math.min(100, risk));

  // Add demo randomness (+/- 5%) to create dynamic dashboard events
  const randomShift = (Math.random() * 10) - 5;
  risk = Math.max(0, Math.min(100, risk + randomShift));

  return parseFloat(risk.toFixed(2));
}

/**
 * Evaluates risk status and suggests actions based on risk score thresholds.
 * @param {number} amount Transaction amount
 * @param {string} location Merchant/customer location
 * @param {string} userId User ID
 * @returns {Object} { score, status, recommendation }
 */
export function evaluateTransaction(amount, location, userId) {
  const score = calculateFraudRisk(amount, location, userId);
  
  let status = "low_risk";
  let recommendation = "approve";
  
  if (score > 75) {
    status = "high_risk";
    recommendation = "block_transaction";
  } else if (score > 50) {
    status = "medium_risk";
    recommendation = "review_transaction";
  }
  
  return { score, status, recommendation };
}
