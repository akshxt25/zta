import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    service: "gmail",
 auth: {
  user: process.env.EMAIL_USER,
  pass: prcoess.env.EMAIL_PASS
 }

})

export const sendOTPEmail = async (to, otp) => {

 try {

  const info = await transporter.sendMail({
    
   from: `"Zero Trust System" <${process.env.EMAIL_USER}>`,
   to: to,
   subject: "Your OTP Code",

   html: `
     <h2>Zero Trust Security</h2>
     <p>Your OTP is:</p>
     <h1>${otp}</h1>
     <p>This OTP is valid for 5 minutes.</p>
   `

  })

  console.log("Email sent:", info.response)

 } catch (error) {

  console.error("Email error:", error)

 }

}