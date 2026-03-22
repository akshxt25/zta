
export function validateEnv() {
  const errors = []

  if (!process.env.MONGO_URI?.trim()) {
    errors.push("MONGO_URI is required")
  }

  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    errors.push(
      "JWT_SECRET is required and must be at least 32 characters (use a long random string)"
    )
  }

  if (!process.env.EMAIL_USER?.trim() || !process.env.EMAIL_PASS?.trim()) {
    errors.push(
      "EMAIL_USER and EMAIL_PASS are required for OTP delivery (e.g. Gmail app password)"
    )
  }

  if (errors.length > 0) {
    console.error("Environment validation failed:")
    for (const msg of errors) console.error(`  - ${msg}`)
    process.exit(1)
  }
}
