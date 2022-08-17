// Imports Libraries
const express = require('express')
const fs = require('fs')
const admin = require('firebase-admin/app')
const firebase = require('firebase-admin')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const { getStorage } = require('firebase-admin/storage')
const { sendMail } = require(__dirname + '/emailer.js')
const { processURL } = require(__dirname + '/setup.js')
const algoliasearch = require('algoliasearch')
const fetch = require('node-fetch')
const paypal = require(__dirname + '/paypal.js')
const zoho = require(__dirname + '/zoho.js')
require('dotenv').config({
    path: __dirname + '/.env',
})

// Initialize Firebase
admin.initializeApp({
    credential: admin.cert(JSON.parse(process.env.FIREBASE)),
    databaseURL: 'https://educationist-42b45-default-rtdb.firebaseio.com/',
    storageBucket: 'educationist-42b45.appspot.com',
})

let db = getFirestore()
let auth = getAuth()
let storageRef = getStorage().bucket()
let rdb = firebase.database()
let ref = rdb.ref('/')

// Initialize Algolia
const client = algoliasearch(process.env.ALGOLIA_APP, process.env.ALGOLIA_ADMIN)
const index = client.initIndex('content_catalog')

// Initializes Express
const app = express()
app.use(express.json())
app.listen(80, () => console.log('App available on', processURL))

// Sets pages variable to use in functions
const pages = { root: __dirname + '/public/pages' }
function templateEngine(name) {
    const data = fs.readFileSync(__dirname + '/public/pages/' + name, 'utf-8')
    const template = fs.readFileSync(
        __dirname + '/public/pages/template.html',
        'utf-8'
    )
    return template.replace('BODY', data)
}

const templateRoutes = {
    register: 'register.html',
    login: 'login.html',
    reset: 'reset.html',
    donate: 'donate.html',
    'donate/honor': 'donate.html',
    content: 'content.html',
    'content/upload': 'upload.html',
    create: 'register-finish.html',
    admin: 'admin.html',
    logs: 'logs.html',
    classes: 'classes.html',
    unsubscribe: 'unsubscribe.html',
    stats: 'stats.html',
    'discord/auth': 'discord.html',
    //TODO Zoho
}

const fullPageRoutes = {
    500: '500.html',
    404: '404.html',
    'donate/success': 'donation-success.html',
    'firebase-error': 'firebase-error.html',
    home: 'home.html',
}

app.get('/', (request, response) => {
    return response.send(templateEngine('index.html'))
})

// Returns static html page for other get routes
app.get('/:page', (request, response) => {
    let route = templateRoutes[request.params.page]
    if (!route) {
        route = fullPageRoutes[request.params.page]
        if (!route) {
            return response.sendFile('404.html', pages)
        }
        return response.sendFile(route, pages)
    }
    return response.send(templateEngine(route))
})

app.get('/class/:classId', (request, response) => {
    return response.send(templateEngine('class.html'))
})

app.get('/newsletter/:issue', (request, response) => {
    const issue = request.params.issue
    let data = fs.readFileSync('public/pages/newsletter.html', 'utf-8')
    data = data.replace(new RegExp('issue', 'g'), issue)
    const template = fs.readFileSync(
        __dirname + '/public/pages/template.html',
        'utf-8'
    )
    return response.send(data)
})

app.get('/announcements/:issue', async (request, response, next) => {
    const issue = request.params.issue
    if (issue === 'preview') {
        return response.send(
            fs.readFileSync('public/emails/update.html', 'utf-8')
        )
    }

    let message
    try {
        message = (await db.collection('announcements').doc(issue).get()).data()
    } catch (error) {
        console.log(error)
        return next()
    }

    if (!message) {
        return response.sendFile('404.html', pages)
    }

    let data
    if (message.total) {
        data = fs.readFileSync(__dirname + '/public/emails/total.html', 'utf-8')
    } else {
        data = fs.readFileSync(
            __dirname + '/public/emails/update.html',
            'utf-8'
        )
    }
    if (message === undefined) {
        return response.send('We could not find that page')
    }
    message = message.message
    data = data.replace(new RegExp('message1', 'g'), message)
    return response.send(data)
})

app.get('/content/document', async (request, response) => {
    let documentId = request.query.id
    return response.send(templateEngine('content-document.html'))
})

app.get('/discord', (request, response) => {
    const url =
        'https://discord.com/api/oauth2/authorize?client_id=' +
        process.env['CLIENT_ID'] +
        '&scope=identify%20guilds.join&response_type=code&redirect_uri=' +
        encodeURIComponent(processURL + '/discord/auth')
    return response.redirect(url)
})

// Handles CSS and JS file requests
app.get('/css/:filename', (request, response) => {
    // Sets headers
    response.setHeader('Cache-Control', 'public, max-age=1')
    response.setHeader('Expires', new Date(Date.now() + 1).toUTCString())

    // Searches for CSS file
    const fileName = request.params.filename
    if (fileName) {
        const file = __dirname + '/public/css/' + fileName

        // Error for invalid filename
        if (!fs.existsSync(file)) {
            return response.status(404).send('We could not find that file!')
        }

        // Sends file
        return response.sendFile(fileName, { root: './public/css' })
    }

    // If there is no filename send error
    return response.status(500).send('Missing query!')
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
        if (!fs.existsSync(file)) {
            return response.status(404).send('We could not find that file!')
        }

        // Returns file
        return response.sendFile(fileName, { root: './public/js' })
    }

    // If there is no filename send error
    return response.status(500).send('Missing query!')
})

// Validates login information
app.post('/login', async (request, response) => {
    // Fetches user information from eid
    const snapshot = await db
        .collection('users')
        .where('eid', '==', request.body.eid)
        .get()

    // Error if the username does not exist
    if (snapshot.empty) {
        response.send('false')
        return
    }

    // Returns the emails
    const email = snapshot.docs[0].data().email
    return response.send(email)
})

// Manages content deleted
app.post('/delete-content', async (request, response) => {
    // Defines variables
    const ids = request.body.ids

    // Verifies if this is an admin
    const id = ids[0]
    const snapshot = await db.collection('content').doc(id).get()
    if (snapshot.exists) {
        return response.send('false')
    }

    // Removes content from algolia
    try {
        await index.deleteObjects(ids)
    } catch (e) {
        console.log(e)
        return response.send('false')
    }

    return response.send('Complete!')
})

// Manages new content curated
app.post('/new-content', async (request, response) => {
    // Defines variables
    const information = request.body.information
    const documentID = information.objectID

    // Verifies if this is an admin
    const snapshot = await db.collection('content').doc(documentID).get()
    if (!snapshot.exists || !snapshot.data().verified) {
        return response.send('false')
    }

    // Adds content to algolia
    try {
        await index.saveObject(information)
    } catch (e) {
        console.log(e)
        return response.send('false')
    }

    return response.send('Complete!')
})

// Handles Express Errors
const errorFunction = (error, request, response, next) => {
    const status = error.status || 400
    // send back an easily understandable error message to the caller
    return response.sendFile('500.html', pages)
}

app.use(errorFunction)
