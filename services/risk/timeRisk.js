export const timeRisk = (context) => {
    if (context.loginHour < 3 || context.loginHour > 23) {
      return { score: 0.2, reason: "Unusual login time" }
    }
    return { score: 0, reason: null }
  }