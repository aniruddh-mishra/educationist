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
    content: 'content.html',
    create: 'confirm-account.html',
    admin: 'admin.html',
    logs: 'logs.html',
    classes: 'classes.html',
    unsubscribe: 'unsubscribe.html',
    stats: 'stats.html',
    account: 'account.html',
    class: 'class.html',
    //TODO Zoho
}

const fullPageRoutes = {
    500: '500.html',
    404: '404.html',
    'donate/success': 'donation-success.html',
    'firebase-error': 'firebase-error.html',
    home: 'home.html',
    students: 'students.html',
    'terms-of-service': 'tos.html',
    faq:'faq.html'
}

// Makes any string lowercase
function lowerCase(string) {
    var newString = ''
    for (character of string) {
        newString += character.toLowerCase()
    }
    return newString
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

// Anouncements retrieval
app.post('/announcements', async (request, response) => {
    const number = request.body.number

    const snapshot = await db
        .collection('announcements')
        .where('total', '==', false)
        .orderBy('timestamp')
        .limitToLast(number)
        .get()

    let announcements = []
    snapshot.forEach((result) => {
        announcements.push(result.data())
    })

    return response.send(announcements)
})

// Places registration information into confirmaiton code
app.post('/register', async (request, response) => {
    // Fetches users with the defined email
    const responses = await db
        .collection('users')
        .where('email', '==', request.body.email)
        .get()

    // Checks if there were users with the previous query
    if (!responses.empty) {
        return response.send('used')
    }

    // Adds the confirmation code to the database and saves document id
    const documentId = (
        await db.collection('confirmations').add({
            type: 'creation',
            data: request.body,
            expire: firebase.firestore.Timestamp.fromMillis(
                Date.now() + 1200000
            ),
        })
    ).id

    // Creates email information to send to user that just registered
    const options = [
        {
            key: 'link1',
            text: processURL + '/create?confirm=' + documentId,
        },
    ]

    const emailSendResult = sendMail(
        request.body.email,
        'Confirm Educationist Account',
        __dirname + '/public/emails/confirm.html',
        options
    )

    if (emailSendResult) {
        return response.send('true')
    }

    return response.send('false')
})

// Finally creates the account
app.post('/create', async (request, response) => {
    // Defines given variables
    const code = request.body.code
    const password = request.body.password
    const eid = request.body.eid

    if (!code) {
        return response.send('failure')
    }

    // Fetches data for the confirmation code given by frontend
    var data = await db.collection('confirmations').doc(code).get()

    // Checks whether the code is valid
    if (!data.exists) {
        return response.send('error')
    }

    if (data.data().expire.toDate() <= Date.now()) {
        await db.collection('confirmations').doc(data.id).delete()
        return response.send('expired')
    }

    // Returns data from confirmation code
    data = data.data().data

    // Fetches users with the defined email
    let responses = await db
        .collection('users')
        .where('email', '==', data.email)
        .get()

    // Checks if there were users with the previous query
    if (!responses.empty) {
        return response.send('used')
    }

    // Defines the timestamp and birthday in terms of js data object
    const timeStamp = new Date(data.timestamp)
    const birthday = new Date(data.birthday)

    // Defines user information based on previous information
    const userInfo = {
        registration: firebase.firestore.Timestamp.fromMillis(
            timeStamp.getTime()
        ),
        email: lowerCase(data.email),
        name: data.name,
        eid: eid,
        role: data.role,
        birthday: firebase.firestore.Timestamp.fromMillis(birthday.getTime()),
        timezone: data.timezone,
    }

    if (data.unsubscribe) {
        userInfo.unsubscribe = data.unsubscribe
    }

    await db.collection('extra-emails').doc(lowerCase(data.email)).delete()

    // Fetches the users with the same eid to confirm that the eid is unique
    responses = await db.collection('users').where('eid', '==', eid).get()

    // Checks if there were users with the previous query
    if (!responses.empty) {
        return response.send('false')
    }

    // Creates firebase auth user, and returns uid of the user
    try {
        var uid = (
            await auth.createUser({
                email: userInfo.email,
                password: password,
            })
        ).uid
    } catch {
        return response.send('failure')
    }

    // Creates user with the uid and user information defined above
    await db.collection('users').doc(uid).create(userInfo)

    // Deletes the confirmation code that was just completed
    await db.collection('confirmations').doc(code).delete()

    return response.send('true')
})

app.post('/volunteer-log', async (request, response) => {
    // Defines given variables
    const students = request.body.students
    const tutorEmail = request.body.tutorEmail
    const entry = request.body.entry
    const minutes = entry.minutes

    let studentEmails = []
    for (const student of students) {
        // Fetches student based on student email
        let studentData = await db
            .collection('users')
            .where('email', '==', student.studentEmail)
            .get()

        // Returns error if student does not exist
        if (studentData.empty) {
            return response.send('false')
        }

        studentData = studentData.docs[0]
        console.log(studentData.data())

        if (
            !(
                studentData.data().unsubscribe &&
                studentData.data().unsubscribe.includes('class-logs')
            )
        ) {
            studentEmails.push(studentData.data().email)
        }

        // Updates user information for student's attendance
        await db
            .collection('users')
            .doc(studentData.id)
            .update({
                'attendance-entries': firebase.firestore.FieldValue.arrayUnion({
                    date: firebase.firestore.Timestamp.fromMillis(
                        new Date(entry.date).getTime()
                    ),
                    minutes: entry.minutes,
                    information: entry.information,
                }),
            })
    }

    // Configures email information
    var options = [
        {
            key: 'minutes1',
            text: minutes,
        },
        {
            key: 'email1',
            text: tutorEmail,
        },
        {
            key: 'name1',
            text: entry.information.tutor,
        },
        {
            key: 'subject1',
            text: entry.information.subject,
        },
    ]

    var recipients = studentEmails

    var tutor = await db
        .collection('users')
        .where('email', '==', tutorEmail)
        .get()

    // Returns error if student does not exist
    if (tutor.empty) {
        return response.send('false')
    }

    tutor = tutor.docs[0]

    if (
        !(
            tutor.data().unsubscribe &&
            tutor.data().unsubscribe.includes('class-logs')
        )
    ) {
        recipients.push(tutorEmail)
    }

    console.log(recipients)

    try {
        // Sends email to tutor
        await sendMail(
            recipients,
            'Educationist Class Log',
            __dirname + '/public/emails/logs.html',
            options,
            false,
            'logs'
        )

        return response.send('Done!')
    } catch (err) {
        // Some sort of error for email not being sent
        console.log('Reset Email Error: ' + err)

        return response.send('Failure')
    }
})

// Handles Express Errors
const errorFunction = (error, request, response, next) => {
    // send back an easily understandable error message to the caller
    return response.sendFile('500.html', pages)
}

app.use(errorFunction)
