const nodemailer = require("nodemailer");
require("dotenv").config();

//sent otp by email
  //1 create email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    service : 'gmail',
    auth : {
        user : process.env.SMTP_MAIL ,
        pass : process.env.SMTP_PASSWORD
    },
    secure: false, // Use TLS but don't verify certificates
    tls: {
    rejectUnauthorized: false // Don't fail on invalid certs
}
    // authMethod: 'LOGIN', // Explicitly set the authentication method
})

const attendanceMark = async (email, status, name, date) => {
    try{
    //2.configure email content
    const mailOptions ={
        from :process.env.SMTP_MAIL,
        to   :  email,
        subject :  "Attendance Marked",
        html:`
        <body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
    <table role="presentation"
      style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
      <tbody>
        <tr>
          <td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;">
            <table role="presentation" style="max-width: 300px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;">
              <tbody>
                <tr>
                  <td style="padding: 20px 0px 0px;">
                    <div style="text-align: center;">
                      <div style="padding: 20px; background-color: #4BAFF8; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                        <h2 style="color: #ffffff; margin-top: 0;margin-bottom: 15; text-align: center;">Attendance Marked</h2>
                        
                        <p style="color: #ffffff; line-height: 1.5;">Your name is: <span style="font-size: 16px; font-weight: bold; color:rgb(83, 221, 117);">${name}</span></p>
                        <p style="color: #ffffff; line-height: 1.5;">Your status is: <span style="font-size: 16px; font-weight: bold; color:rgb(83, 221, 117);">${status}</span></p>
                        <p style="color: #ffffff; line-height: 1.5;">Date is: <span style="font-size: 16px; font-weight: bold; color: rgb(83, 221, 117);">${date}</span></p>

                        <div style="margin-top: 20px; color: #d8d5d5; font-size: 12px; text-align: center;">
                          <p>This email was sent automatically. Please do not reply.</p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
        `
       
    }

    //3.send email
   transporter.sendMail(mailOptions, (error,info)=>{
    if(error) {
        console.error("Error sending emailxx:", error);
    }else{
        console.log("Email sent:", info.response);
    }
  });
}catch(error){
    console.error("Error sending email!(try catch block):", error);
    throw error; // rethrow the error to be caught in the calling function
}
};
const sendEmail = async (email, subject, text) => {
    try{
    //2.configure email content
    const mailOptions ={
        from :process.env.SMTP_MAIL,
        to   :  email,
        subject : subject,
        text:text
       
    }

    //3.send email
   transporter.sendMail(mailOptions, (error,info)=>{
    if(error) {
        console.error("Error sending emailxx:", error);
    }else{
        console.log("Email sent:", info.response);
    }
  });
}catch(error){
    console.error("Error sending email!(try catch block):", error);
    throw error; // rethrow the error to be caught in the calling function
}
}
module.exports = { attendanceMark ,sendEmail } 