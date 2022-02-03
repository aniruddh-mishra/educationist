// Imports Libraries
const admin = require('firebase-admin/app')
const firebase = require('firebase-admin')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const { secretKeys, processURL } = require(__dirname + '/setup.js')
const nodemailer = require('nodemailer')
const fs = require('fs')
const prompt = require('prompt-sync')()
require('dotenv').config({
    path: __dirname + '/.env',
})

const issue = prompt('Which issue? ')

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

db.collection('users')
    .get()
    .then((snapshot) => {
        snapshot.forEach((doc) => {
            if (!emails.includes(doc.data().email)) {
                emails.push(doc.data().email)
            }
        })
        ref.once('value').then((snapshot) => {
            const data = snapshot.val()
            const oldDb = data['Activated IDs']
            for (const [key, value] of Object.entries(oldDb)) {
                if (!emails.includes(value.Email)) {
                    emails.push(value.Email)
                }
            }
            console.log(emails)
            const sure = prompt('Are you sure? ')
            if (sure === 'yes' || sure === 'y') {
                sendMail(
                    emails,
                    'Educationist Newsletter',
                    'public/pages/newsletter.html',
                    [
                        {
                            key: 'issue',
                            text: issue,
                        },
                    ]
                )
            }
        })
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
