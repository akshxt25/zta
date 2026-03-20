export const locationRisk = (context) => {
    if (context.location && context.location !== "IN") {
      return { score: 0.3, reason: "Foreign location" }
    }
    return { score: 0, reason: null }
  }