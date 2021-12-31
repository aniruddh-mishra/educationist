// Imports Libraries
const express = require('express')
const fs = require('fs')
const admin = require('firebase-admin/app')
const firebase = require('firebase-admin')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const { sendMail } = require(__dirname + '/emailer.js')
const { secretKeys, processURL } = require(__dirname + '/setup.js')
const algoliasearch = require('algoliasearch')
const rateLimit = require('express-rate-limit')
require('dotenv').config({
    path: __dirname + '/.env',
})

// Initialize Firestore
admin.initializeApp({
    credential: admin.cert(JSON.parse(process.env.FIREBASE)),
})

var db = getFirestore()

// // Initialize Algolia
const client = algoliasearch(process.env.ALGOLIA_APP, process.env.ALGOLIA_ADMIN)
const index = client.initIndex('content_catalog')

// Ban function if user spams a page
function ban() {
    const file = fs.readFileSync(__dirname + '/public/pages/ban.html', 'utf-8')
    return file
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: ban(),
})

// Sets pages variable to use in functions
const pages = { root: __dirname + '/public/pages' }

// Initializes express app
const app = express()

app.use(express.json())

// Routes
app.get('/', async (request, response) => {
    response.sendFile('index.html', pages)
})

app.get('/register', (request, response) => {
    response.sendFile('register.html', pages)
})

app.get('/login', (request, response) => {
    response.sendFile('login.html', pages)
})

app.get('/reset', (request, response) => {
    response.sendFile('reset.html', pages)
})

app.get('/donate', (request, response) => {
    response.redirect('https://www.paypal.com/paypalme/educationisttutoring')
})

app.get('/content', limiter, (request, response) => {
    response.sendFile('content.html', pages)
})

app.get('/content/document', async (request, response) => {
    response.sendFile('content-page.html', pages)
})

app.get('/css/:filename', (request, response) => {
    // Sets headers
    response.setHeader('Cache-Control', 'public, max-age=1')
    response.setHeader('Expires', new Date(Date.now() + 1).toUTCString())

    // Searches for CSS file
    const fileName = request.params.filename
    if (fileName) {
        const file = __dirname + '/public/css/' + fileName

        // Error for invalid filename
        if (fs.existsSync(file) == false) {
            response.status(404).send('We could not find that file!')
        }

        // Sends file
        response.sendFile(fileName, { root: './public/css' })
        return
    }

    // If there is no filename send error
    response.status(500).send('Missing query!')
})

app.get('/js/:filename', (request, response) => {
    // Sets headers
    response.setHeader('Cache-Control', 'public, max-age=1')
    response.setHeader('Expires', new Date(Date.now() + 1).toUTCString())

    // Searches for JS file
    const fileName = request.params.filename
    if (fileName) {
        const file = __dirname + '/public/js/' + fileName

        // Error for invalid filename
        if (fs.existsSync(file) == false) {
            return response.status(404).send('We could not find that file!')
        }

        // Adds secret variables to the js file before sending
        if (secretKeys[fileName.replace('.js', '')]) {
            fs.readFile(file, 'utf8', (error, data) => {
                if (error) {
                    return response
                        .status(404)
                        .send('We could not find that file!')
                }
                for (key of secretKeys[fileName.replace('.js', '')].keys) {
                    data = data.replace(key.name, key.key)
                }
                response.send(data)
            })
        } else {
            // Returns original file if no keys needed
            response.sendFile(fileName, { root: './public/js' })
        }
        return
    }

    // If there is no filename send error
    response.status(500).send('Missing query!')
})

app.post('/login', async (request, response) => {
    // Finds the user
    const users = db.collection('users')
    const snapshot = await users.where('eid', '==', request.body.eid).get()

    // Error if the username does not exist
    if (!snapshot) {
        response.send('false')
        return
    }

    // Returns the emails
    const email = snapshot.docs[0].data().email
    response.send(email)
})

app.post('/reset', async (request, response) => {
    // Assigns email to variable
    let { email } = request.body

    // Creates settings for reset url
    let actioncodesettings = {
        url: 'https://dashboard.educationisttutoring.org/login',
    }

    // Generates password reset link
    getAuth()
        .generatePasswordResetLink(email, actioncodesettings)
        .then(async (link) => {
            // Sends email
            options = [
                {
                    key: 'link1',
                    text: link,
                },
            ]

            try {
                await sendMail(
                    email,
                    'Password Reset Educationist Tutoring',
                    __dirname + '/public/emails/reset.html',
                    options
                )
            } catch (err) {
                // Some sort of error for email not being sent
                console.log('Reset Email Error: ' + err)
                return response.send('Failure')
            }

            response.send('Success')
        })
        .catch((error) => {
            // Email was not recognized error
            if (error.code === 'auth/email-not-found') {
                return response.send('Not Exist')
            }
            console.log('Reset Error: ' + error)
            response.send('Failure')
        })
})

app.post('/loghours', async (request, response) => {
    const data = doc.data()
    const objectID = doc.id
    return index.saveObject({ ...data, objectID })
})

app.post('/ban', async (request, reponse) => {
    const uid = request.body.uid
    db.collection('users')
        .doc(uid)
        .update({
            banned: firebase.firestore.Timestamp.fromMillis(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
        })
})

// Starts express app
app.listen(80, () => console.log('App available on', processURL))
