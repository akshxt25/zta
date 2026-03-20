export const behaviorRisk = (context, logs) => {
    if (!logs || logs.length === 0) return { score: 0, reason: null }
  
    const avgHour =
      logs.reduce((acc, l) => acc + new Date(l.timestamp).getHours(), 0) /
      logs.length
  
    const deviation = Math.abs(avgHour - context.loginHour)
  
    if (deviation > 6) {
      return { score: 0.25, reason: "Behavior anomaly (time deviation)" }
    }
  
    return { score: 0, reason: null }
  }