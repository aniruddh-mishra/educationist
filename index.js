const express = require('express');
const fs = require('fs');
const admin = require("firebase-admin");
const { response } = require('express');
const stripe = require("stripe")(process.env.STRIPE_KEY);
const serviceAccount = require(__dirname + "/firebase.json");
const axios = require('axios')

const app = express();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://educationist-42b45-default-rtdb.firebaseio.com"
});

var db = admin.database();

db = db.ref("/")

app.use(express.json());

app.get('/', (request, response) => {
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
    const fileName = request.query.file;
    if (fileName) {
        var file = __dirname + '/root/js/' + fileName
        if (fs.existsSync(file) == false) {
            response.status(404).send("We could not find that file!")
        }
        response.sendFile(file)
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
        axios
        .post('https://mainframe.educationisttutoring.org/reset', {
            email: email,
            link: link
        })
        .then(res => {
            response.send("Success")
        })
        .catch(error => {
            response.status(400)
        })
    })
    .catch((error) => {
        if (error.code === "auth/email-not-found") {
            return response.status(500).send("Failure")
        }
        console.log(error)
        return response.status(400).send("Failure")
    });
})

app.post("/create-payment-intent", async (request, response) => {
    const {eid, amount} = request.body;

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd"
    });

    response.send({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
    });
});

app.post("/webhook", (request, response) => {
    const event = request.body;
    console.log(event.type)
    switch (event.type) {
        case 'charge.succeeded':
            console.log(event.type)
            const checkoutSession = event.data.object;
            db.child("Payment Intents").child(checkoutSession.payment_intent).once('value', (data) => {
                const eid = data.val()
                if (eid === null) {
                    console.log("NO EID")
                    return
                }
                const amount = checkoutSession.amount_captured
                db.child("Payment Intents").child(checkoutSession.payment_intent).set(null);
                db.child("Activated IDs").child(eid).once('value', (data) => {
                    const information = data.val()
                    if (information === null) {
                        console.log("NO EID INFORMATION")
                        return
                    }
                    var donations = information.Donations
                    if (donations === undefined) {
                        donations = 0
                    }
                    donations += amount
                    console.log(donations)
                    db.child("Activated IDs").child(eid).child("Donations").set(donations)
                    var records = information["Donation Records"]
                    if (records === undefined) {
                        records = []
                    }
                    records.push(checkoutSession.payment_intent)
                    db.child("Activated IDs").child(eid).child("Donation Records").set(records)
                });
            });
            break;
        default:
            console.log(`Unhandled event type ${event.type}.`);
    }
    response.send("Done")
});    

app.listen(80, () => console.log('App available on https://dashboard.educationisttutoring.org'))