const exp = require('constants');
const express = require('express');
const fs = require('fs');
const { emailError } = require('./emailer');
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { sendMail, db, admin } = require(__dirname + '/emailer.js');

const navBar = fs.readFileSync(__dirname + '/root/navBar.html', 'utf8')

const secretKeys = {
    donate: {
        keys: [{
            name: 'STRIPE_KEY',
            key: process.env.STRIPE_PUBLIC
        }]
    },
    root: {
        keys: [{
            name: 'NAVIGATION',
            key: navBar
        }]
    }
}

const app = express();

app.use(express.json());

function expire(response) {
    response.setHeader("Cache-Control", "public, max-age=0.01");
    response.setHeader("Expires", new Date(Date.now() + 1).toUTCString());
    return response
}

app.get('/', async (request, response) => {
    response = expire(response);
    response.sendFile(__dirname + '/root/index.html');
});

app.get('/logout', (request, response) => {
    response = expire(response);
    response.sendFile(__dirname + '/root/logout.html');
});

app.get('/login', (request, response) => {
    response = expire(response);
    response.sendFile(__dirname + '/root/login.html');
});

app.get('/reset', (request, response) => {
    response = expire(response);
    response.sendFile(__dirname + "/root/reset.html");
});

app.get('/testing/availabilities', (request, response) => {
    response = expire(response);
    response.sendFile(__dirname + '/root/availabilities.html');
});

app.get('/css', (request, response) => {
    response = expire(response);
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
    response = expire(response);
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
    response = expire(response);
    response.sendFile(__dirname + '/root/donate.html');
});

app.post("/reset", async (request, response) => {
    response = expire(response);
    let {email} = request.body;
    let actioncodesettings = {
        url: "https://dashboard.educationisttutoring.org/login"
    }
    admin
    .auth()
    .generatePasswordResetLink(email, actioncodesettings)
    .then(async (link) => {
        options = [{
            key: 'link1',
            text: link
        }]

        try {
            await sendMail(email, 'Password Reset Educationist Tutoring', __dirname + '/root/emails/reset.html', options)
        } catch (err) {
            console.log("Reset Email Error: " + err)
            emailError(email, 'reset', options)
            return response.status(400).send("Failure")
        }
        
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
    response = expire(response);
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
    response = expire(response);
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
            .then(async () => {
                const date = new Date()
                const email = checkoutSession.receipt_email;
                const amount = checkoutSession.amount_captured;
                options = [{
                    key: 'amount',
                    text: '$' + String(parseFloat(amount/100).toFixed(2))
                },
                {
                    key: 'date',
                    text: date.toDateString()
                }]
                
                try {
                    await sendMail(email, 'Donation Confirmation Educationist Tutoring', __dirname + '/root/emails/receipt.html', options)
                } catch (err) {
                    console.log("Receipt Email Error: " + err)
                    emailError(email, 'receipt', options)
                }

                response.send("Done")
            })
            break;
        default:
            console.log(`Unhandled event type ${event.type}.`);
            return response.send("Unhandled event type")
    }
});    

app.listen(80, () => console.log('App available on https://dashboard.educationisttutoring.org'))