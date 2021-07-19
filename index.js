const express = require('express');
const fs = require('fs');
const admin = require("firebase-admin");
const { response } = require('express');
const stripe = require("stripe")(process.env.STRIPE_KEY);
const serviceAccount = require(__dirname + '/firebase.json');
const { sendMail } = require(__dirname + '/emailer.js');

const secretKeys = {
    donate: {
        keys: [{
            name: 'STRIPE_KEY',
            key: process.env.STRIPE_PUBLIC
        }]
    }
}

const app = express();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://educationist-42b45-default-rtdb.firebaseio.com"
});

var db = admin.database();

db = db.ref("/")

app.use(express.json());

app.get('/', (request, response) => {
    sendMail('aniruddhm17@gmail.com', 'Donation Confirmation Educationist Tutoring', 'root/emails/receipt.html')
    response.sendFile(__dirname + '/root/index.html');
});

app.get('/logout', (request, response) => {
    response.sendFile(__dirname + '/root/logout.html');
});

app.get('/login', (request, response) => {
    response.sendFile(__dirname + '/root/login.html');
});

app.get('/reset', (request, response) => {
    response.sendFile(__dirname + "/root/reset.html");
});

app.get('/testing/availabilities', (request, response) => {
    response.sendFile(__dirname + '/root/availabilities.html');
});

app.get('/css', (request, response) => {
    const fileName = request.query.file;
    if (fileName) {
        var file = __dirname + '/root/css/' + fileName
        if (fs.existsSync(file) == false) {
            response.status(404).send("We could not find that file!")
        }
        response.sendFile(file)
        return
    }
    response.status(500).send("Missing query!")
});

app.get('/js', (request, response) => {
    var fileName = request.query.file;
    if (fileName) {
        var file = __dirname + '/root/js/' + fileName
        fileName = fileName.replace('.js', '')
        if (fs.existsSync(file) == false) {
            return response.status(404).send("We could not find that file!")
        }
        fs.readFile(file, 'utf8', (error, data) => {
            if (error) {
                return response.status(404).send("We could not find that file!")
            }
            if (secretKeys[fileName]) {
                for (key of secretKeys[fileName].keys) {
                    data = data.replace(key.name, key.key)
                }
            }
            response.send(data)
        })
        return
    }
    response.status(404).send("We could not find that file!")
});

app.get('/donate', (request, response) => {
    response.sendFile(__dirname + '/root/donate.html');
});

app.post("/reset", (request, response) => {
    let {email} = request.body;
    let actioncodesettings = {
        url: "https://dashboard.educationisttutoring.org/login"
    }
    admin
    .auth()
    .generatePasswordResetLink(email, actioncodesettings)
    .then((link) => {
        options = [{
            key: 'link1',
            text: link
        }]
        
        sendMail(email, 'Password Reset Educationist Tutoring', 'root/emails/reset.html', options)
        response.send("Success")
    })
    .catch((error) => {
        if (error.code === "auth/email-not-found") {
            return response.status(500).send("Failure")
        }
        console.log('Reset Error: ' + error)
        return response.status(400).send("Failure")
    });
})

app.post("/create-payment-intent", async (request, response) => {
    const {email, amount} = request.body;

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        receipt_email: email
    });

    response.send({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
    });
});

app.post("/webhook", (request, response) => {
    const event = request.body;
    switch (event.type) {
        case 'charge.succeeded':
            const checkoutSession = event.data.object;
            db.child("Payment Intents").child(checkoutSession.payment_intent).once('value', (data) => {
                const eid = data.val()
                if (eid === null) {
                    return
                }
                const amount = checkoutSession.amount_captured
                db.child("Payment Intents").child(checkoutSession.payment_intent).set(null);
                db.child("Activated IDs").child(eid).once('value', (data) => {
                    const information = data.val()
                    if (information === null) {
                        return
                    }
                    var donations = information.Donations
                    if (donations === undefined) {
                        donations = 0
                    }
                    donations += amount
                    db.child("Activated IDs").child(eid).child("Donations").set(donations)
                    var records = information["Donation Records"]
                    if (records === undefined) {
                        records = []
                    }
                    records.push(checkoutSession.payment_intent)
                    db.child("Activated IDs").child(eid).child("Donation Records").set(records)
                });
            })
            .then(() => {
                const date = new Date()
                const email = checkoutSession.receipt_email;
                const amount = checkoutSession.amount_captured;
                options = [{
                    key: 'amount',
                    text: amount
                },
                {
                    key: 'date',
                    text: date.toDateString()
                }]
                
                sendMail(email, 'Donation Confirmation Educationist Tutoring', 'root/emails/receipt.html', options)
                response.send("Done")
            })
            break;
        default:
            console.log(`Unhandled event type ${event.type}.`);
    }
});    

app.listen(80, () => console.log('App available on https://dashboard.educationisttutoring.org'))