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
