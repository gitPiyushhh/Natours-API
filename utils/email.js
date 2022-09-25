const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        // service: 'Gmail', // Any mail service here
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: { // Authorisation of the sender
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
        // Activate in gemail "less secure app options"
        
    })
    // 2. Define the email information
    const mailOptions = {
        from: 'Piyush Sultaniya <hello@piyush.io>',
        to: options.email,
        subject: options.subject,
        text: options.message,  // In all these options we are generating the email automatically
        // html: 
    }
    // 3. Actually send the email
    try {
        transporter.sendMail(mailOptions); // This is going to return a promise
    } catch(err) {
        console.log(err.message);
    }
    
}

module.exports = sendEmail;