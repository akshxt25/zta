const evaluatePolicy = (riskScore) => {

    if (riskScore < 0.3) {
     return "ALLOW"
    }
   
    if (riskScore < 0.7) {
     return "MFA_REQUIRED"
    }
   
    return "DENY"
   
   }
   
   export default evaluatePolicy;