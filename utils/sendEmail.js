const nodemailer = require("nodemailer");
const ejs = require("ejs");

const sendEmail = async (email, param1, param2, temp, mailSubject) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const html = await ejs.renderFile(__dirname + temp, { param1, param2 })

        const mailOptions = {
            from: {
                name: 'Gotex',
                address: process.env.EMAIL
            },
            to: email,
            subject: mailSubject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
    } catch (error) {
        return { msg: 'Failed to send email', error }
    }
};

module.exports = sendEmail