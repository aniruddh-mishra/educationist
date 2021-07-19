const nodemailer = require('nodemailer');
const fs = require('fs');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'educationist@educationisttutoring.org',
      pass: process.env.PASSWORD
    }
});

function sendMail(recipient, subject, fileName, options) {
    try {
        var data = fs.readFileSync(fileName, 'utf8')
        if (options) {
            for (change of options) {
                console.log(data)
                data = data.replace(new RegExp(change.key, 'g'), change.text);
            }
        }
        var mailOptions = {
            from: 'Educationist Tutoring <educationist@educationisttutoring.org>',
            to: recipient,
            subject: subject,
            html: data
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('Email Send Error: ' + error);
            } else {
              console.log('Email sent: ' + info.response);
            }
        });
    } catch (error) {
        console.log("Email Error: " + error)
    }
}

module.exports.sendMail = sendMail;