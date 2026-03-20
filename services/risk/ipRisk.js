export const ipRisk = (context) => {
    if (context.ip && context.ip.startsWith("185.")) {
      return { score: 0.5, reason: "Suspicious IP" }
    }
    return { score: 0, reason: null }
  }