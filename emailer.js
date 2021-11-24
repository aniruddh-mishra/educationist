// Imports Libraries
const nodemailer = require('nodemailer')
const fs = require('fs')
require('dotenv').config({
    path: __dirname + '/.env',
})

// Creates instance of transporter
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'educationist@educationisttutoring.org',
        pass: process.env.PASSWORD,
    },
})

// Sends the main with transporter
function sendMail(recipient, subject, fileName, options) {
    // Reads the html file for requested email
    var data = fs.readFileSync(fileName, 'utf8')

    // Changes the variables in the html email based on options
    if (options) {
        for (change of options) {
            data = data.replace(new RegExp(change.key, 'g'), change.text)
        }
    }

    // Changes sender info
    var mailOptions = {
        from: 'Educationist Tutoring <educationist@educationisttutoring.org>',
        to: recipient,
        subject: subject,
        html: data,
    }

    // Returns promise of transport.sendmail
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

// Exports module
module.exports.sendMail = sendMail
