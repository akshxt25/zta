import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "testappforme20@gmail.com",
    pass: "svut ldec xsgj vvbd"
  }
})

export const sendOTPEmail = async (to, otp) => {
  try {
    await transporter.sendMail({
      from: `"Zero Trust System" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your OTP Code",
      html: `
        <h2>Zero Trust Security</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `
    })
  } catch (err) {
    console.error("Email error:", err.message)
  }
}