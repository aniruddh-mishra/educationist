var dataSet = [
    'volunteer Hours',
    'attendance',
    'eid',
    'name',
    'birthday',
    'email',
    'timezone',
    'subjects',
]
const storage = firebase.app().storage('gs://educationist-42b45.appspot.com/')
const storageRef = storage.ref()
var contents = {}
var total = false

async function setUp() {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', '/announcements/preview', true)
    xhr.send()
    xhr.onload = async function () {
        const response = this.response.replace(
            'message1',
            '<div id="preview-insert"> </div>'
        )
        document.getElementById('preview-email').innerHTML = response
    }
    const reports = await db
        .collection('reports')
        .where('complete', '!=', true)
        .get()
    if (reports.empty) {
        token('No reports right now!')
        document.querySelector('.reports').remove()
        return
    }
    var counter = 1
    reports.forEach((doc) => {
        var block = document.createElement('div')
        block.className = 'block'
        block.id = doc.id
        var titleBlock = document.createElement('h3')
        titleBlock.innerHTML = 'Report #' + counter
        block.append(titleBlock)
        const data = doc.data()
        const date = 'Date: ' + data.date.toDate()
        const link =
            'Content: <a href="/content/document?id=' +
            data.document +
            '" target="_blank" rel="noopener noreferrer">Link to Document</a>'
        const text = 'Report: ' + data.text
        const button =
            '<button onclick="complete(this.parentNode)" class="end-report">Declare Complete</button>'
        fields = [date, link, text, button]
        for (field of fields) {
            var fieldBlock = document.createElement('p')
            fieldBlock.className = 'block-field'
            fieldBlock.innerHTML = field
            block.append(fieldBlock)
        }
        document.querySelector('.report-blocks').appendChild(block)
        counter += 1
    })
}

document.querySelector('body').style.display = 'block'
setUp()
certificates()
content()

async function interview(accept) {
    this.disabled = true
    if (document.getElementById('subject').value === '') {
        token('You must put something in the subject field')
        this.disabled = false
        return
    }
    var snapshot = await db
        .collection('users')
        .where(
            'eid',
            '==',
            lowerCase(document.getElementById('eid').value.trim())
        )
        .get()
    if (snapshot.empty) {
        token('That username does not seem to exist.')
        this.disabled = false
        return
    }
    const tutor = snapshot.docs[0]
    const email = tutor.data().email
    const birthday = tutor.data().birthday.toDate().getFullYear()
    if (new Date().getFullYear() - birthday < 13 && accept) {
        token('This user is still under 13, and must be rejected!')
        this.disabled = false
        return
    }
    const id = tutor.id
    var update = {}
    if (accept) {
        var subjects = tutor.data().subjects
        if (subjects === undefined) {
            subjects = [document.getElementById('subject').value]
        } else if (
            !subjects.includes(document.getElementById('subject').value)
        ) {
            subjects.push(document.getElementById('subject').value)
        }
        update = {
            subjects: subjects,
            role: 'tutor',
        }
    } else {
        var subjects = tutor.data().subjects
        if (subjects != undefined) {
            const index = subjects.indexOf(
                document.getElementById('subject').value
            )
            if (index > -1) {
                subjects.splice(index, 1)
            }
            update = {
                subjects: subjects,
            }
        }
    }

    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/accept', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            uid: localStorage.getItem('uid'),
            email: email,
            accept: accept,
            subject: document.getElementById('subject').value,
        })
    )
    xhr.onload = async function () {
        const response = this.response
        if (response === 'Done!') {
            if (update != {}) {
                await db.collection('users').doc(id).update(update)
            }
            if (accept) {
                token(
                    'User accepted in ' +
                        document.getElementById('subject').value
                )
            } else {
                token(
                    'User rejected in ' +
                        document.getElementById('subject').value
                )
            }
            this.disabled = false
            return
        }
        token('Something went wrong, please try again later!')
    }
}

async function search(e) {
    e.disabled = true
    document.querySelector('.user-data').innerHTML = ''
    if (e.id === 'search-btn') {
        var email = lowerCase(document.getElementById('email').value.trim())
        var snapshot = await db
            .collection('users')
            .where('email', '==', email)
            .get()
    } else {
        var username = lowerCase(
            document.getElementById('username').value.trim()
        )
        var snapshot = await db
            .collection('users')
            .where('eid', '==', username)
            .get()
    }
    if (snapshot.empty) {
        token('That username does not exist')
        e.disabled = false
        return
    }
    var user = snapshot.docs[0].data()
    const volunteerHours = user['volunteer-entries']
    const attendance = user['attendance-entries']

    if (volunteerHours != undefined) {
        var minutes = 0
        for (entry of volunteerHours) {
            minutes += entry.minutes
        }
        user['volunteer Hours'] = minutes + ' Minutes'
    }

    if (attendance != undefined) {
        var minutes = 0
        for (entry of attendance) {
            minutes += entry.minutes
        }
        user.attendance = minutes + ' Minutes'
    }

    user.birthday = user.birthday.toDate().getFullYear()
    for (key of dataSet) {
        if (user[key] == undefined) {
            continue
        }
        var block = document.createElement('div')
        block.className = 'block'
        var titleBlock = document.createElement('h3')
        titleBlock.innerHTML = key.charAt(0).toUpperCase() + key.slice(1)
        block.append(titleBlock)
        var fieldBlock = document.createElement('p')
        fieldBlock.className = 'block-field'
        fieldBlock.innerHTML = user[key]
        block.append(fieldBlock)
        document.querySelector('.user-data').appendChild(block)
    }
    spacer = document.createElement('div')
    spacer.className = 'spacer'
    document.querySelector('.user-data').appendChild(spacer)
    e.disabled = false
}

async function complete(e) {
    const reportId = e.parentNode.id
    if (!e.childNodes[0].classList.contains('confirm')) {
        e.childNodes[0].classList.add('confirm')
        token(
            'If you are sure that you want to mark this task as complete, click again!'
        )
        return
    }
    await db.collection('reports').doc(reportId).update({ complete: true })
    token('Task marked as complete!')
}

async function certificates() {
    const certificates = await db.collection('certificates').get()
    if (certificates.empty) {
        token('No certificate requests right now!')
        document.querySelector('.certificates-container').remove()
        return
    }
    certificates.forEach(async (doc) => {
        var block = document.createElement('div')
        block.className = 'block'
        block.classList.add('certificate-block')
        block.id = doc.id
        var titleBlock = document.createElement('h3')
        titleBlock.innerHTML = 'Certificate Request'
        block.append(titleBlock)
        const data = doc.data()
        const [minutes, email, eid] = await minutesGet(
            data.uid,
            data.start.toDate(),
            data.end.toDate()
        )
        const minutesInfo = 'Minutes: ' + minutes
        const emailInfo = 'Email: ' + email
        const eidInfo = 'Username: ' + eid
        var ref = storageRef
            .child('certificates')
            .child(data.uid)
            .child(doc.id)
            .child('certificate.pdf')
        const url = await ref.getDownloadURL()
        const button =
            '<button onclick="downloadCertificate(\'' +
            url +
            '\')" class="certificate-btn">Download Certificate</button>'
        const button2 =
            '<button onclick="uploadCertificate(this.parentNode.parentNode, \'' +
            data.uid +
            '\')" class="certificate-btn">Upload Signed</button>'
        const button3 =
            '<button onclick="deleteCertificate(this.parentNode.parentNode)" class="certificate-btn">Delete Certificate</button>'
        fields = [minutesInfo, emailInfo, eidInfo, button, button2, button3]
        for (field of fields) {
            var fieldBlock = document.createElement('p')
            fieldBlock.className = 'block-field'
            fieldBlock.innerHTML = field
            block.append(fieldBlock)
        }
        document.querySelector('.certificates').appendChild(block)
    })
}

async function minutesGet(uid, start, end) {
    const user = (await db.collection('users').doc(uid).get()).data()
    const entries = user['volunteer-entries']
    var minutes = 0
    for (entry of entries) {
        const date = entry.date.toDate()
        if (
            entry.information.type === 'transfer' &&
            start >= new Date(2022, 0, 0, 0, 0, 0, 0)
        ) {
            continue
        }
        if (date >= start && date <= end) {
            minutes += entry.minutes
        }
    }
    return [minutes, user.email, user.eid]
}

function downloadCertificate(url) {
    window.open(url)
}

async function deleteCertificate(e) {
    e.remove()
    await db.collection('certificates').doc(e.id).delete()
    token('Removed this certificate request!')
}

async function uploadCertificate(e, uid) {
    const input = document.getElementById('file')
    input.value = ''
    input.setAttribute(
        'onchange',
        'uploadCertificateFinish("' + e.id + '", "' + uid + '")'
    )
    input.click()
}

async function uploadCertificateFinish(request, uid) {
    document.getElementById(request).remove()
    const file = document.getElementById('file').files[0]
    const ref = storageRef.child('send').child(request + '.pdf')
    await ref.put(file, { contentType: 'application/pdf' })
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/certificate', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            uid: uid,
            request: request,
        })
    )
    xhr.onload = async function () {
        if (this.response === 'Failure') {
            token('Something went wrong, please try again later')
            return
        }
        await db.collection('certificates').doc(request).delete()
        await ref.delete()
        await storageRef
            .child('certificates')
            .child(uid)
            .child(request)
            .child('certificate.pdf')
            .delete()
        token(this.response)
    }
}

async function announce() {
    const message = document.getElementById('email-send').value
    const recipients = document.getElementById('recipients').value
    if (recipients === 'none') {
        token(
            'Make sure to change the recipients to whom you want to send this announcement.'
        )
        return
    }
    var id = await db.collection('announcements').add({
        timestamp: firebase.firestore.Timestamp.fromMillis(Date.now()),
        message: message,
        eid: localStorage.getItem('eid'),
        total: total,
    })
    id = id.id
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/announce', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            role: recipients,
            id: id,
            total: total,
        })
    )
    xhr.onload = function () {
        if (this.response === 'false') {
            token('Something went wrong, might need to check your outbox')
            return
        }
        token('Emails sent!')
    }
}

async function content() {
    const snapshot = await db
        .collection('content')
        .where('verified', '==', false)
        .get()
    var counter = 1
    if (snapshot.empty) {
        document.querySelector('.content-verifications').remove()
        return
    }
    snapshot.forEach((doc) => {
        var block = document.createElement('div')
        block.className = 'block'
        block.classList.add('content-block')
        block.id = doc.id
        var titleBlock = document.createElement('h3')
        titleBlock.innerHTML = 'Content # ' + counter
        block.append(titleBlock)
        const input =
            '<input style="margin-bottom: 0;" type="text" placeholder="Link" />'
        const submit =
            '<button onclick="replaceLink(this)" class="content-btn">Replace Link</button>'
        const button =
            '<button onclick="openContent(this)" class="content-btn">Open Content</button>'
        const button2 =
            '<button onclick="verify(this)" class="content-btn">Approve Content</button>'
        const button3 =
            '<button onclick="deleteContent(this)" class="content-delete-btn">Delete Content</button>'

        fields = [input, submit, button, button2, button3]
        for (field of fields) {
            var fieldBlock = document.createElement('p')
            fieldBlock.className = 'block-field'
            fieldBlock.innerHTML = field
            block.append(fieldBlock)
        }
        document.querySelector('.content-blocks').appendChild(block)
        counter += 1
        contents[doc.id] = doc.data()
        contents[doc.id].verified = true
        contents[doc.id].objectID = doc.id
    })
    document.querySelector('.content-verifications').classList.remove('temp')
}

function openContent(e) {
    const url = '/content/document?id=' + e.parentNode.parentNode.id
    window.open(url)
}

async function replaceLink(e) {
    const linkInput = e.parentNode.previousSibling.childNodes[0]
    if (linkInput.value === '') {
        token('Put something in the link input please.')
        return
    }
    const docID = e.parentNode.parentNode.id
    await db.collection('content').doc(docID).update({
        link: linkInput.value,
    })
    token('Done!')
}

async function verify(e) {
    const docID = e.parentNode.parentNode.id
    await db.collection('content').doc(docID).update({
        verified: true,
    })
    var password
    cArr.forEach((val) => {
        if (val.indexOf('admin=') === 0) password = val.substring(6)
    })
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/new-content', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            information: contents[docID],
            password: password,
        })
    )
    xhr.onload = async function () {
        if (this.response === 'false') {
            await db.collection('content').doc(docID).update({
                verified: false,
            })
            token('Something went wrong, please try again later')
            return
        }
        token(this.response)
    }
    e.parentNode.parentNode.remove()
}

async function deleteContent(e) {
    if (!e.classList.contains('sure')) {
        token('Click again if you are sure to delete this...')
        e.classList.add('sure')
    }
    const docID = e.parentNode.parentNode.id
    const contentData = contents[docID]
    var password
    cArr.forEach((val) => {
        if (val.indexOf('admin=') === 0) password = val.substring(6)
    })
    if (contentData.creator) {
        const snapshot = await db
            .collection('users')
            .doc(contentData.creator)
            .get()
        if (snapshot.exists) {
            const userData = snapshot.data()
            const entries = userData['volunteer-entries']
            for (entry of entries) {
                if (entry.information.type != 'content') {
                    continue
                }
                if (entry.information.reference.id === docID) {
                    await db
                        .collection('users')
                        .doc(snapshot.id)
                        .update({
                            'volunteer-entries':
                                firebase.firestore.FieldValue.arrayRemove(
                                    entry
                                ),
                            'created-content':
                                firebase.firestore.FieldValue.arrayRemove(
                                    docID
                                ),
                        })
                }
            }
        }
    }
    if (contentData['file-name']) {
        await storageRef
            .child('content')
            .child(contentData.creator)
            .child(contentData['file-name'])
            .delete()
    }
    await db.collection('content').doc(docID).delete()
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/delete-content', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            ids: [docID],
        })
    )
    xhr.onload = async function () {
        if (this.response === 'false') {
            token('Something went wrong, please try again later')
            return
        }
        token(this.response)
    }
    e.parentNode.parentNode.remove()
}

function previewEmail(e) {
    if (total) {
        return
    }
    document.getElementById('preview-insert').innerHTML = e.value
}

function togglePreview(e) {
    document.getElementById('preview-email').classList.toggle('temp')
    if (e.innerHTML != 'Unpreview') {
        e.innerHTML = 'Unpreview'
    } else {
        e.innerHTML = 'Preview Email'
    }
}

function totalEmail(e) {
    total = !total
    if (total) {
        document.getElementById('preview-insert').innerHTML = ''
        e.innerHTML = 'Template Email'
    } else {
        e.innerHTML = 'Total Email'
    }
    token(total)
}
