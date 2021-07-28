const express = require('express');
const fs = require('fs');
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { sendMail, db, admin, emailError } = require(__dirname + '/emailer.js');
const { deleteUser, updateUser, makeUser, getNewToken, authorize } = require(__dirname + '/google.js')
const { secretKeys, processURL } = require(__dirname + '/setup.js')
const rateLimit = require("express-rate-limit");

function ban() {
    const file = fs.readFileSync(__dirname + '/root/ban.html', 'utf-8');
    return file
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: ban()
});

const app = express();

app.use(express.json());

app.get('/', async (request, response) => {
    response.sendFile(__dirname + '/root/index.html')
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

app.get('/donate', (request, response) => {
    response.sendFile(__dirname + '/root/donate.html');
});

app.get('/content', limiter, (request, response) => {
    response.sendFile(__dirname + '/root/content.html')
});

app.get('/authenticate', (request, response) => {
    const code = request.query.code;
    getNewToken(code);
    return response.send("Thank you for verifying!")
})

app.get('/css', (request, response) => {
    response.setHeader("Cache-Control", "public, max-age=1");
    response.setHeader("Expires", new Date(Date.now() + 1).toUTCString());
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
    response.setHeader("Cache-Control", "public, max-age=1");
    response.setHeader("Expires", new Date(Date.now() + 1).toUTCString());
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
    response.status(500).send("Missing query!")
});

app.post("/ban", (request, response) => {
    db.child('Banned IDs').child(request.body.uid).set(new Date().getTime() + (15 * 24 * 3600 * 1000));
})

app.post("/reset", async (request, response) => {
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

                response.send("Done");
            })
            break;
        default:
            console.log(`Unhandled event type ${event.type}.`);
            return response.send("Unhandled event type");
    }
});    

app.post('/makeuser', (request, response) => {
    const data = request.body
    return response.send(makeUser(data.name, data.eid, data.email))
})

app.post('/deleteuser', (request, response) => {

})

app.post('/changepassword', (request, response) => {

})

authorize()

app.listen(80, () => console.log('App available on', processURL))