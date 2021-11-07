const nodemailer = require('nodemailer')
const fs = require('fs')
require('dotenv').config({
    path: __dirname + '/.env',
})

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'educationist@educationisttutoring.org',
        pass: process.env.PASSWORD,
    },
})

function sendMail(recipient, subject, fileName, options) {
    var data = fs.readFileSync(fileName, 'utf8')
    if (options) {
        for (change of options) {
            data = data.replace(new RegExp(change.key, 'g'), change.text)
        }
    }
    var mailOptions = {
        from: 'Educationist Tutoring <educationist@educationisttutoring.org>',
        to: recipient,
        subject: subject,
        html: data,
    }

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log('Email Send Error: ' + err)
                reject(err)
            } else {
                console.log('Email Sent: ' + info.response)
                resolve(info)
            }
        })
    })
}

module.exports.sendMail = sendMail
