// Imports Libraries
const express = require('express')
const fs = require('fs')
const admin = require('firebase-admin/app')
const firebase = require('firebase-admin')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const { getStorage } = require('firebase-admin/storage')
const { sendMail } = require(__dirname + '/emailer.js')
const { secretKeys, processURL } = require(__dirname + '/setup.js')
const rateLimit = require('express-rate-limit')
const algoliasearch = require('algoliasearch')
const { response } = require('express')
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

var db = getFirestore()
var auth = getAuth()
var storageRef = getStorage().bucket()
var rdb = firebase.database()
var ref = rdb.ref('/')

// // Initialize Algolia
const client = algoliasearch(process.env.ALGOLIA_APP, process.env.ALGOLIA_ADMIN)
const index = client.initIndex('content_catalog')

// Ban function if user spams a page
function ban() {
    const file = fs.readFileSync(__dirname + '/public/pages/ban.html', 'utf-8')
    return file
}

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

const routes = {
    '': 'index.html',
    'register': 'register.html',
    'login': 'login.html',
    'reset': 'reset.html',
    'donate': 'donate.html',
    'donate/honor': 'donate.html',
    'content': 'content.html',
    'content/document': 'content-page.html',
    'content/upload': 'upload.html',
    'create': 'register-finish.html',
    'admin': 'admin.html',
    'logs': 'logs.html',
    'classes': 'classes.html',
    'unsubscribe': 'unsubscribe.html',
    'stats': 'stats.html',
    'discord/auth': 'discord.html'
    //TODO Zoho
}

app.get('/class/:classId', async (request, response) => {
    return response.send(templateEngine('class.html'))
})

app.get('/donate/success', async (request, response) => {
    return response.sendFile('donation-success.html', pages)
})

app.get('/newsletter/:issue', (request, response) => {
    const issue = request.params.issue
    var data = fs.readFileSync('public/pages/newsletter.html', 'utf-8')
    data = data.replace(new RegExp('issue', 'g'), issue)
    const template = fs.readFileSync(
        __dirname + '/public/pages/template.html',
        'utf-8'
    )
    return response.send(data)
})

app.get('/announcements/:issue', async (request, response) => {
    const issue = request.params.issue
    if (issue === 'preview') {
        return response.send(
            fs.readFileSync('public/emails/update.html', 'utf-8')
        )
    }
    var message = (await db.collection('announcements').doc(issue).get()).data()

    if (message.total) {
        var data = fs.readFileSync(
            __dirname + '/public/emails/total.html',
            'utf-8'
        )
    } else {
        var data = fs.readFileSync(
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

app.get('/discord', (request, response) => {
    const url =
        'https://discord.com/api/oauth2/authorize?client_id=' +
        process.env['CLIENT_ID'] +
        '&scope=identify%20guilds.join&response_type=code&redirect_uri=' +
        encodeURIComponent(processURL + '/discord/auth')
    response.redirect(url)
})

app.get('/discord/auth', async (request, response) => {
    response.send(templateEngine('discord.html'))
})

app.get('/discord/token', async (request, response) => {
    return response.send('hi')
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

// Returns static html page for other get routes
app.get('/:page', async (request, response) => {
    return response.send(templateEngine(routes[request.params.page]))
})