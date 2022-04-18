// Imports Libraries
const nodemailer = require('nodemailer')
const fs = require('fs')
require('dotenv').config({
    path: __dirname + '/.env',
})

// Creates instance of transporter
var transporterRegular = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env['UPDATES_USERNAME'],
        pass: process.env['UPDATES_PASSWORD'],
    },
})

var transporterNoReply = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env['NOREPLY_USERNAME'],
        pass: process.env['NOREPLY_PASSWORD'],
    },
})

var transporterVolunteerHours = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env['LOGS_USERNAME'],
        pass: process.env['LOGS_PASSWORD'],
    },
})

var transporters = {
    regular: transporterRegular,
    noReply: transporterNoReply,
    volunteerHours: transporterVolunteerHours,
}

var emails = {
    regular: process.env['UPDATES_USERNAME'],
    noReply: process.env['NOREPLY_USERNAME'],
    volunteerHours: process.env['LOGS_USERNAME'],
}

// Sends the main with transporter
function sendMail(recipient, subject, fileName, options, files, email) {
    // Reads the html file for requested email
    var data = fs.readFileSync(fileName, 'utf8')

    // Changes the variables in the html email based on options
    if (options) {
        for (change of options) {
            data = data.replace(new RegExp(change.key, 'g'), change.text)
        }
    }

    var transporter = transporterRegular
    var emailAddress = emails.regular
    if (email) {
        transporter = transporters[email]
        emailAddress = emails[email]
    }

    // Changes sender info
    var mailOptions = {
        from: 'Educationist Tutoring <' + emailAddress + '>',
        bcc: recipient,
        subject: subject,
        html: data,
    }

    if (files != undefined) {
        mailOptions.attachments = files
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
