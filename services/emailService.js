import nodemailer from "nodemailer"

const user = process.env.EMAIL_USER
const pass = process.env.EMAIL_PASS

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user,
    pass
  }
})

export const sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Zero Trust System" <${user}>`,
    to,
    subject: "Your OTP Code",
    html: `
        <h2>Zero Trust Security</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `
  })
}

export const sendLoginNotificationEmail = async (to, context) => {
  const device = context?.deviceMeta || "Unknown device"
  const ip = context?.ip || "Unknown IP"
  const location = context?.location || "Unknown location"

  await transporter.sendMail({
    from: `"Zero Trust System" <${user}>`,
    to,
    subject: "New sign-in to your account",
    html: `
        <h2>New sign-in detected</h2>
        <p>Your Zero Trust account was just used to sign in.</p>
        <ul>
          <li><strong>Device</strong>: ${device}</li>
          <li><strong>IP address</strong>: ${ip}</li>
          <li><strong>Location</strong>: ${location}</li>
        </ul>
        <p>If this was you, no action is needed. If not, change your password immediately and review your recent activity.</p>
      `
  })
}
