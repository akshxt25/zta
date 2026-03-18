const calculateRisk = (context, user) => {

    let risk = 0
   
    console.log("---- RISK DEBUG ----")
   
    if (context.location && context.location !== "IN") {
     risk += 0.3
     console.log("Location risk +0.3")
    }
   
    const isTrustedDevice = user.trustedDevices.includes(context.device)
   
    if (!isTrustedDevice) {
     risk += 0.25
     console.log("Device risk +0.25")
    }
   
    if (context.loginHour < 3 || context.loginHour > 23) {
     risk += 0.2
     console.log("Time risk +0.2")
    }
   
    if (context.ip && context.ip.startsWith("185.")) {
     risk += 0.5
     console.log("IP risk +0.25")
    }
   
    console.log("Final Risk:", risk)
   
    return risk
   
   }
   
   export default calculateRisk