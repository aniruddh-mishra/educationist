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
require('dotenv').config({
    path: __dirname + '/.env',
})

// Initialize Firestore
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

app.get('/create', async (request, response) => {
    response.sendFile('register-finish.html', pages)
})

app.get('/admin', async (request, response) => {
    response.sendFile('admin.html', pages)
})

app.get('/classes', async (request, response) => {
    response.sendFile('classes.html', pages)
})

app.get('/class/:classId', async (request, response) => {
    response.sendFile('class.html', pages)
})

app.get('/newsletter/:issue', (request, response) => {
    const issue = request.params.issue
    var data = fs.readFileSync('public/pages/newsletter.html', 'utf-8')
    data = data.replace(new RegExp('issue', 'g'), issue)
    return response.send(data)
})

app.get('/announcements/:issue', async (request, response) => {
    const issue = request.params.issue
    var data = fs.readFileSync('public/emails/update.html', 'utf-8')
    var message = (await db.collection('announcements').doc(issue).get()).data()
    if (message === undefined) {
        return response.send('We could not find that page')
    }
    message = message.message
    data = data.replace(new RegExp('message1', 'g'), message)
    return response.send(data)
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

// Returns matching requests to tutors
app.post('/match-requests', async (request, response) => {
    // Defines given variables
    const subjects = request.body.subjects
    const eid = request.body.eid

    // If tutor has not been accepted in any subjects, an error is returned
    if (subjects === undefined) {
        return response.send('error')
    }

    // Fetches all the requests the tutor can teach and ensures the tutor does not recieve their own requests
    var requests = await db
        .collection('requests')
        .where('subject', 'in', subjects)
        .where('eid', '!=', eid)
        .get()

    // Configures data in a list to return
    var responseObject = []
    requests.forEach((doc) => {
        responseObject.push(doc.data())
    })

    // Sends back a list of data
    return response.send(responseObject)
})

// Returns matching requests to tutors
app.post('/my-requests', async (request, response) => {
    // Defines given variables
    const eid = request.body.eid

    // Fetches all the requests the tutor can teach and ensures the tutor does not recieve their own requests
    var requests = await db.collection('requests').where('eid', '==', eid).get()

    // Configures data in a list to return
    var responseObject = []
    requests.forEach((doc) => {
        responseObject.push([doc.data(), doc.id])
    })

    // Sends back a list of data
    return response.send(responseObject)
})

// Creates a match between tutor and student
app.post('/match-commit', async (request, response) => {
    // Defines given variables
    var transfer = request.body.transfer
    var tutor = request.body.tutor
    var student = request.body.student
    const subject =
        request.body.subject.charAt(0).toLowerCase() +
        request.body.subject.slice(1)

    // Checks source of request
    if (transfer === 'true') {
        // Changes tutor to be the uid of the tutor
        // Fetches tutor from eid
        const snapshot = await db
            .collection('users')
            .where('eid', '==', tutor)
            .get()

        // Confirms if eid is valid
        if (snapshot.empty) {
            return response.send('false')
        }

        tutor = snapshot.docs[0].id
        var tutorData = snapshot.docs[0].data()
    }

    // Fetches information about the student
    student = await db
        .collection('users')
        .where('eid', '==', student)
        .limit(1)
        .get()

    // Confirms if eid is valid
    if (student.empty) {
        return response.send('false')
    }

    student = student.docs[0]

    // Fetches information about the tutor
    if (transfer != 'true') {
        var tutorData = (await db.collection('users').doc(tutor).get()).data()
    }
    const studentData = student.data()

    // Ads the new details to a new class in firestore
    await db.collection('matches').add({
        creation: firebase.firestore.Timestamp.fromMillis(Date.now()),
        students: [
            {
                student: student.id,
                studentEmail: studentData.email,
                studentName: studentData.name,
            },
        ],
        tutor: tutor,
        tutorEmail: tutorData.email,
        subject: subject,
        tutorName: tutorData.name,
    })

    // Creates the email data to be sent to the student and tutor
    const options = [
        {
            key: 'subject1',
            text: subject,
        },
        {
            key: 'information1',
            text:
                'Tutor: ' +
                tutorData.name +
                '<br>Tutor Email: ' +
                tutorData.email +
                '<br>Student: ' +
                studentData.name +
                '<br>Student Email: ' +
                studentData.email,
        },
    ]

    try {
        // Sends the email to the tutor and the student
        await sendMail(
            [tutorData.email, studentData.email],
            'Educationist Tutoring Class Update',
            __dirname + '/public/emails/match.html',
            options
        )

        // Fetches the request the student made for the class
        if (transfer != 'true') {
            const snapshot = await db
                .collection('requests')
                .where('eid', '==', studentData.eid)
                .where('subject', '==', subject)
                .get()
            const document = snapshot.docs[0].id

            // Deletes the request fetched above
            await db.collection('requests').doc(document).delete()
        }
    } catch (err) {
        // Some sort of error for email not being sent
        console.log('Reset Email Error: ' + err)

        return response.send('false')
    }

    return response.send('true')
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
                Date.now() + 300000
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

    try {
        // Sends the email to the user
        await sendMail(
            request.body.email,
            'Welcome to Educationist Tutoring',
            __dirname + '/public/emails/confirm.html',
            options
        )
    } catch (err) {
        // Some sort of error for email not being sent
        console.log('Reset Email Error: ' + err)
        return response.send('Failure')
    }

    return response.send('true')
})

// Finally creates the account
app.post('/create', async (request, response) => {
    // Defines given variables
    const code = request.body.code
    const password = request.body.password
    const eid = request.body.eid

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

    // Defines the timestamp and birthday in terms of js data object
    const timeStamp = new Date(data.timestamp)
    const birthday = new Date(data.birthday)

    // Defines user information based on previous information
    const userInfo = {
        registration: firebase.firestore.Timestamp.fromMillis(
            timeStamp.getTime()
        ),
        email: data.email.charAt(0).toLowerCase() + data.email.slice(1),
        name: data.name,
        eid: eid,
        role: data.role,
        birthday: firebase.firestore.Timestamp.fromMillis(birthday.getTime()),
        timezone: data.timezone,
    }

    // Fetches the users with the same eid to confirm that the eid is unique
    const responses = await db.collection('users').where('eid', '==', eid).get()

    // Checks if there were users with the previous query
    if (!responses.empty) {
        return response.send('false')
    }

    // Creates firebase auth user, and returns uid of the user
    const uid = (
        await auth.createUser({
            email: userInfo.email,
            password: password,
        })
    ).uid

    // Creates user with the uid and user information defined above
    await db.collection('users').doc(uid).create(userInfo)

    // Deletes the confirmation code that was just completed
    await db.collection('confirmations').doc(code).delete()

    return response.send('true')
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

// Handles user reset password query
app.post('/reset', async (request, response) => {
    // Defines given variables
    let email = request.body.email

    // Creates redirect settings for reset url
    let actioncodesettings = {
        url: 'https://dashboard.educationisttutoring.org/login',
    }

    // Generates password reset link
    getAuth()
        .generatePasswordResetLink(email, actioncodesettings)
        .then(async (link) => {
            // Creates email information
            options = [
                {
                    key: 'link1',
                    text: link,
                },
            ]

            try {
                // Sends the email
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

            return response.send('Success')
        })
        .catch((error) => {
            // Email was not recognized error
            if (error.code === 'auth/email-not-found') {
                return response.send('Not Exist')
            }
            console.log('Reset Error: ' + error)
            return response.send('Failure')
        })
})

// Returns classes that a user is a part of
app.post('/classes', async (request, response) => {
    // Defines given variables
    const uid = request.body.uid
    const student = request.body.student
    const email = request.body.email
    const name = request.body.name

    // Configures data to be returned in a list
    var matchReturn = []

    // Data if user is a tutor
    if (student === 'false') {
        // Fetches data if user is a tutor
        var matches = await db
            .collection('matches')
            .where('tutor', '==', uid)
            .get()

        // Adds data to the return list
        matches.forEach((doc) => {
            matchReturn.push({ data: doc.data(), id: doc.id })
        })
    }

    // Fetches all classes when user is a student
    matches = await db
        .collection('matches')
        .where('students', 'array-contains', {
            student: uid,
            studentName: name,
            studentEmail: email,
        })
        .get()

    // Ads classes to list
    matches.forEach((doc) => {
        matchReturn.push({ data: doc.data(), id: doc.id })
    })

    return response.send(matchReturn)
})

// Logs the volunteer hours
app.post('/volunteer-log', async (request, response) => {
    // Defines given variables
    const students = request.body.students
    const tutorEmail = request.body.tutorEmail
    const entry = request.body.entry
    const minutes = entry.minutes

    var studentEmails = []
    for (student of students) {
        studentEmails.push(student.studentEmail)
    }

    for (email of studentEmails) {
        // Fetches student based on student email
        var student = await db
            .collection('users')
            .where('email', '==', email)
            .get()

        // Returns error if student does not exist
        if (student.empty) {
            return response.send('false')
        }

        student = student.docs[0]

        // Updates user information for student's attendance
        db.collection('users')
            .doc(student.id)
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

    try {
        var recipients = studentEmails
        recipients.push(tutorEmail)

        // Sends email to tutor
        await sendMail(
            recipients,
            'Educationist Class Log',
            __dirname + '/public/emails/volunteer.html',
            options
        )

        return response.send('Done!')
    } catch (err) {
        // Some sort of error for email not being sent
        console.log('Reset Email Error: ' + err)

        return response.send('Failure')
    }
})

// Manages new content curated
app.post('/new-content', async (request, response) => {
    // Defines name based on request of user
    var name = null
    var user = await db
        .collection('users')
        .where('eid', '==', request.body.eid)
        .get()
    if (user.empty) {
        return response.send('Done')
    }
    user = user.docs[0]
    if (request.body.author === 'Yes') {
        name = user.data().name
    }

    // Defines the information for the content based on request.body
    var information = {
        age: request.body.age,
        author: name,
        date: firebase.firestore.Timestamp.fromMillis(Date.now()),
        link: request.body.id,
        subject: request.body.subject,
        title: request.body.title,
        type: request.body.type,
        upvotes: 0,
    }

    // Adds content with information to firebase and recieves the contentId
    const contentId = await db.collection('content').add(information)
    information.objectID = contentId.id

    // Creates a volunteer hours entry with the content Id in it
    const entry = {
        date: firebase.firestore.Timestamp.fromMillis(
            new Date(Date.now()).getTime()
        ),
        minutes: parseInt(request.body.minutes),
        information: {
            type: 'content',
            reference: contentId,
        },
    }

    // Updates user with volunteer hour entry defined above
    await db
        .collection('users')
        .doc(user.id)
        .update({
            'volunteer-entries':
                firebase.firestore.FieldValue.arrayUnion(entry),
        })

    // Adds content to algolia
    await index.saveObject(information)

    return response.send('Complete!')
})

// Transfer user information from old database
app.post('/transfer-data', async (request, response) => {
    // Defines given variables
    const eid = request.body.eid
    const username = request.body.username

    // Initializes old database json file
    const snapshot = await ref.once('value')
    const oldDb = snapshot.val()
    const oldUsers = oldDb['Activated IDs']
    const oldHours = oldDb['Volunteering Hours']

    // Checks for subjects the user may be accepted in
    var subjects = []
    const user = oldUsers[eid]
    if (user != undefined) {
        if (user.Subjects != undefined) {
            for (subject of user.Subjects) {
                // Makes subject lower case
                subjects.push(
                    subject.charAt(0).toLowerCase() + subject.slice(1)
                )
            }
        }
    }

    // Checks for old volunteer hours
    var totalHours = 0
    const userHours = oldHours[eid]
    if (userHours != undefined) {
        totalHours = userHours.Total['Total Time']
    }

    // Fetches user from new database
    const snapshotUser = await db
        .collection('users')
        .where('eid', '==', username)
        .get()

    // Returns if user does not exist
    if (snapshotUser.empty) {
        return response.send('Failure')
    }

    const userAccount = snapshotUser.docs[0]

    // Updates based on what information was found in old database
    if (subjects != [] && totalHours != 0) {
        const entry = {
            date: firebase.firestore.Timestamp.fromMillis(
                new Date(Date.now()).getTime()
            ),
            minutes: parseInt(totalHours),
            information: {
                type: 'transfer',
            },
        }
        db.collection('users')
            .doc(userAccount.id)
            .update({
                'volunteer-entries':
                    firebase.firestore.FieldValue.arrayUnion(entry),
            })
        db.collection('users').doc(userAccount.id).update({
            subjects: subjects,
        })
    } else if (subjects != []) {
        db.collection('users').doc(userAccount.id).update({
            subjects: subjects,
        })
    } else if (totalHours != 0) {
        db.collection('users')
            .doc(userAccount.id)
            .update({
                'volunteer-entries':
                    firebase.firestore.FieldValue.arrayUnion(entry),
            })
    }

    // Saves volunteer hours to new child
    if (userHours != undefined) {
        const userRefNew = ref.child('Volunteering Hours Backup').child(eid)
        userRefNew.set(userHours)

        // Deletes Volunteer Hours of User to prevent multiple entries
        const userRef = ref.child('Volunteering Hours').child(eid)
        await userRef.set(null)
    }

    return response.send('Success!')
})

// Handles emailing for interview
app.post('/accept', async (request, response) => {
    const email = request.body.email
    const uid = request.body.uid
    const role = (await db.collection('users').doc(uid).get()).data().role
    if (role != 'admin') {
        response.send('You must be an admin to accept people into Educationist')
        return
    }
    // Configures email information
    var options = [
        {
            key: 'subject1',
            text: request.body.subject,
        },
    ]

    try {
        // Sends email to tutor
        if (!request.body.accept) {
            await sendMail(
                email,
                'Educationist Interview Results',
                __dirname + '/public/emails/reject.html',
                options
            )
        } else {
            await sendMail(
                email,
                'Educationist Acceptance!',
                __dirname + '/public/emails/accept.html',
                options
            )
        }

        return response.send('Done!')
    } catch (err) {
        // Some sort of error for email not being sent
        console.log('Reset Email Error: ' + err)

        return response.send('Failure')
    }
})

// Send certificates
app.post('/certificate', async (request, response) => {
    const uid = request.body.uid
    const requestId = request.body.request
    const user = (await db.collection('users').doc(uid).get()).data()
    const email = user.email
    const data = await storageRef.file('send/' + requestId + '.pdf').download()
    const files = [{ filename: 'Certificate.pdf', content: data[0] }]
    try {
        const options = [{ key: 'name1', text: user.name }]
        // Sends email to tutor
        await sendMail(
            email,
            'Educationist Volunteering Certificate',
            __dirname + '/public/emails/certificate.html',
            options,
            files
        )

        await db.collection('certificates').doc(requestId).delete()

        return response.send('Done!')
    } catch (err) {
        // Some sort of error for email not being sent
        console.log('Reset Email Error: ' + err)

        return response.send('Failure')
    }
})

// Announces Message Using Template
app.post('/announce', async (request, response) => {
    //Defines given variables
    const role = request.body.role
    const docId = request.body.id

    // Retrieves doc
    const message = (
        await db.collection('announcements').doc(docId).get()
    ).data().message

    if (message === undefined) {
        return response.send('false')
    }

    // Retrieves Users to Send Email to
    if (role === 'all') {
        var users = await db.collection('users').get()
    } else if (role === 'test') {
        var users = 'test'
    } else {
        var users = await db.collection('users').where('role', '==', role).get()
    }

    if (users === 'test') {
        // Configures email
        const options = [
            {
                key: 'message1',
                text:
                    message +
                    ' If you are having trouble viewing this email, <a href="https://dashboard.educationisttutoring.org/announcements/' +
                    docId +
                    '"> click here.</a>',
            },
        ]

        // Sends the email
        await sendMail(
            'educationist@educationisttutoring.org',
            'Educationist Announcement',
            __dirname + '/public/emails/update.html',
            options
        )
        return
    } else if (users.empty) {
        return response.send('false')
    }

    var emails = []
    users.forEach((doc) => {
        if (!emails.includes(doc.data().email)) {
            emails.push(doc.data().email)
        }
    })

    // Groups users to batch them into bcc emails
    var final = []
    var temp = []
    for (i = 0; i < emails.length; i++) {
        if (i === emails.length - 1) {
            if (temp.length >= 100) {
                final.push(temp)
                final.push([emails[i]])
            } else {
                temp.push(emails[i])
                final.push(temp)
            }
            break
        }
        if (temp.length < 100) {
            temp.push(emails[i])
            continue
        }
        final.push(temp)
        temp = []
        temp.push(emails[i])
    }

    // Configures email
    const options = [
        {
            key: 'message1',
            text:
                message +
                ' If you are having trouble viewing this email, <a href="https://dashboard.educationisttutoring.org/announcements/' +
                docId +
                '"> click here.</a>',
        },
    ]

    for (batch of final) {
        try {
            // Sends the email
            await sendMail(
                batch,
                'Educationist Announcement',
                __dirname + '/public/emails/update.html',
                options
            )
        } catch (err) {
            // Some sort of error for email not being sent
            console.log('Reset Email Error: ' + err)

            return response.send('false')
        }
    }
})

// Returns admin page based on password check
app.post('/admin', (request, response) => {
    const password = request.body.password
    if (password === process.env['ADMIN_PASSWORD']) {
        return response.sendFile('admin-file.html', pages)
    }
    return response.send('false')
})

// Bans user based on request
app.post('/ban', async (request, response) => {
    // Defines given variables
    const uid = request.body.uid

    // Updates user information to have a banned value 30 days from now
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
