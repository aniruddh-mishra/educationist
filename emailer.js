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
    console.log(__dirname + '/' + fileName)

    fileName = __dirname + '/' + fileName

    fs.readFile(fileName, 'utf8', (error, data) => {
        if(error) {
            console.log("Email Error: " + error)
        } else {
            if (options) {
                for (change of options) {
                    data = data.replaceAll(change.key, change.text)
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
        }
    })
}

module.exports.sendMail = sendMail;