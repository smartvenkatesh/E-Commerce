import nodemailer from "nodemailer";

export const sendMail = async (to, subject, text) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "venkatesh619dx@gmail.com",
        pass: "njpa ftdu hcsp koxx",
      },
    });

    let info = await transporter.sendMail({
      from: '"Event Booking" <your-email@gmail.com>',
      to,
      subject,
      text,
    });

    console.log("Email sent: %s", info.messageId);
    return true;
  } catch (err) {
    console.error("Mail sending error:", err);
    return false;
  }
};
