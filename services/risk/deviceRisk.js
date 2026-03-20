export const deviceRisk = (context, user) => {
    const isTrusted = user.trustedDevices.includes(context.device)
  
    if (!isTrusted) {
      return { score: 0.25, reason: "New device" }
    }
  
    return { score: 0, reason: null }
  }