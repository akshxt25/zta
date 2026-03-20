import { POLICY_CONFIG } from "../config/policyConfig.js"

const evaluatePolicy = (riskScore) => {
  if (riskScore < POLICY_CONFIG.thresholds.allow) return "ALLOW"
  if (riskScore < POLICY_CONFIG.thresholds.mfa) return "MFA_REQUIRED"
  return "DENY"
}

export default evaluatePolicy