// Imports Libraries
const admin = require('firebase-admin/app')
const firebase = require('firebase-admin')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const { secretKeys, processURL } = require(__dirname + '/setup.js')
const nodemailer = require('nodemailer')
const fs = require('fs')
const e = require('express')
const { group } = require('console')
const prompt = require('prompt-sync')()
require('dotenv').config({
    path: __dirname + '/.env',
})

// Initialize Firestore
admin.initializeApp({
    credential: admin.cert(JSON.parse(process.env.FIREBASE)),
    databaseURL: 'https://educationist-42b45-default-rtdb.firebaseio.com/',
})

var db = getFirestore()
var auth = getAuth()
var rdb = firebase.database()
var ref = rdb.ref('/')
var emails = []

ref.once('value').then((snapshot) => {
    const data = snapshot.val()
    const oldDb = data['Activated IDs']
    for (const [key, value] of Object.entries(oldDb)) {
        if (!emails.includes(value.Email)) {
            emails.push(value.Email)
        }
    }
    var counter = 0
    var final = []
    var temp = []
    for (i = 0; i < emails.length; i++) {
        if (i === emails.length - 1) {
            if (temp.length >= 100) {
                final.push(temp)
                final.push([emails[i]])
            } else {
                temp.push(emails[i])
                final.push(temp)
            }
            break
        }
        if (temp.length < 100) {
            temp.push(emails[i])
            continue
        }
        final.push(temp)
        temp = []
        temp.push(emails[i])
    }
    for (groupRecipients of final) {
        sendMail(groupRecipients, 'Educationist Update', 'update.html')
    }
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
function sendMail(recipient, subject, fileName) {
    // Reads the html file for requested email
    var data = fs.readFileSync(fileName, 'utf8')

    // Changes sender info
    var mailOptions = {
        from: 'Educationist Tutoring <educationist@educationisttutoring.org>',
        bcc: recipient,
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
