const nodemailer = require('nodemailer');
const fs = require('fs');
const admin = require("firebase-admin");
require('dotenv').config({
    path: __dirname + '/.env'
});

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE)),
    databaseURL: "https://educationist-42b45-default-rtdb.firebaseio.com"
});

var db = admin.database();

db = db.ref("/")

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'educationist@educationisttutoring.org',
      pass: process.env.PASSWORD
    }
});

function sendMail(recipient, subject, fileName, options) {
    var data = fs.readFileSync(fileName, 'utf8')
    if (options) {
        for (change of options) {
            data = data.replace(new RegExp(change.key, 'g'), change.text);
        }
    }
    var mailOptions = {
        from: 'Educationist Tutoring <educationist@educationisttutoring.org>',
        to: recipient,
        subject: subject,
        html: data
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log('Email Send Error: ' + err);
                reject(err)
            }
            else {
                console.log('Email Sent: ' + info.response);
                resolve(info)
            }
        })
    })
}

function emailError(recipient, routine, options) {
    const id = Date.now() + Math.random().toString(36).substring(7)
    db.child("Email Que").child(id).set({
        options: options,
        recipient: recipient,
        routine: routine
    });
}

module.exports.sendMail = sendMail;
module.exports.emailError = emailError
module.exports.db = db
module.exports.admin = admin