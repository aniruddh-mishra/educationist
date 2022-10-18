const fs = require('fs')
const sgMail = require('@sendgrid/mail')
const { send } = require('process')
require('dotenv').config({
    path: __dirname + '/.env',
})

sgMail.setApiKey(process.env.SENDGRID_SECRET)

const emails = {
    logs: 'class_logs@educationisttutoring.org',
    updates: 'updates@educationisttutoring.org',
}

async function sendMail(recipient, subject, fileName, options, files, email) {
    // Reads the html file for requested email
    let html = fs.readFileSync(fileName, 'utf8')
    let sender = emails.updates

    // Changes the variables in the html email based on options
    if (options) {
        for (const change of options) {
            html = html.replace(new RegExp(change.key, 'g'), change.text)
        }
    }

    if (email) {
        sender = emails[email]
    }

    const msg = {
        to: recipient,
        from: {
            name: 'Educationist Tutoring',
            email: sender,
        },
        subject: subject,
        html: html,
    }

    if (files) {
        msg.attachments = files
    }

    try {
        await sgMail.send(msg)
        return true
    } catch (error) {
        console.error(error)
        return false
    }
}

module.exports.sendMail = sendMail
