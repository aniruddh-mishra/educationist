const params = new URLSearchParams(window.location.search)
var documentID = params.get('id')
var bookmarks = []
var owner = false
var userData
var contentData
const storage = firebase.app().storage('gs://educationist-42b45.appspot.com/')
const storageRef = storage.ref()

async function getData() {
    const content = await db.collection('content').doc(documentID).get()
    if (content.data() === undefined) {
        document.querySelector('.main-body').innerHTML = ''
        const h1 = document.createElement('h1')
        h1.innerHTML = 'There is no content with the id given...'
        const information = document.createElement('p')
        information.innerHTML = 'Make sure you are at the correct URL.'
        document.querySelector('.main-body').appendChild(h1)
        document.querySelector('.main-body').appendChild(information)

        document.querySelector('.main-body').style.display = 'block'
        document.querySelector('.main-body').style.textAlign = 'center'
        return
    }
    const user = await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .get()
    userData = user.data()
    bookmarks = user.data().bookmarks
    if (bookmarks != undefined && bookmarks.includes(documentID)) {
        document.getElementById('bookmark-button').innerHTML = 'Unbookmark'
        document
            .getElementById('bookmark-button')
            .setAttribute('onclick', 'unBookmark(this)')
    }
    const data = content.data()
    contentData = data
    document.getElementById('preview').setAttribute('src', data.link)
    document.getElementById('expand').setAttribute(
        'onclick',
        `openLink("${data.link}"
        )`
    )
    document.getElementById('upvotes').innerHTML = `Upvotes: ${data.upvotes}`
    document.getElementById('age').innerHTML = `Age: ${data.age}`
    document.getElementById('subject').innerHTML = `Subject: ${capitalize(
        data.subject
    )}`
    document.getElementById('type').innerHTML = capitalize(data.type)
    if (
        data.creator === localStorage.getItem('uid') ||
        userData.role === 'admin'
    ) {
        owner = true
        const verified = document.createElement('p')
        verified.id = 'verified'
        if (data.verified) {
            verified.innerHTML = 'Verified'
        } else {
            verified.innerHTML = 'To Be Verified'
        }
        document.getElementById('info').appendChild(verified)
        const button = document.createElement('button')
        button.id = 'delete'
        button.innerHTML = 'Remove Content'
        button.classList = 'red-btn'
        button.setAttribute('onclick', 'deleteContent()')
        document.getElementById('report-form').appendChild(button)
    }
}

getData()

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

function openLink(link) {
    window.open(link, '_blank').focus()
}

async function report() {
    const problem = document.getElementById('report-text').value
    if (problem == '') {
        return
    }
    document.getElementById('submit-report').toggleAttribute('disabled')
    await db.collection('reports').add({
        complete: false,
        text: problem,
        date: firebase.firestore.Timestamp.now(),
        user: localStorage.getItem('uid'),
        document: documentID,
    })
    token('Your report has been sent!')
}

async function upvote() {
    const button = document.getElementById('upvote-button')
    try {
        await db
            .collection('content')
            .doc(documentID)
            .update({ upvotes: firebase.firestore.FieldValue.increment(1) })
    } catch {
        button.disabled = true
        token('You can only upvote an item once!')
        return
    }
    const doc = await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .get()

    db.collection('users')
        .doc(doc.id)
        .update({
            upvotes: firebase.firestore.FieldValue.arrayUnion(documentID),
        })

    button.disabled = true
    token('You have successfully upvoted this item!')
}

var form = document.getElementById('report-form')
function handleForm(event) {
    event.preventDefault()
}
form.addEventListener('submit', handleForm)

async function bookmark(button) {
    button.disabled = true
    await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .update({
            bookmarks: firebase.firestore.FieldValue.arrayUnion(documentID),
        })
    button.setAttribute('onclick', 'unBookmark(this)')
    button.innerHTML = 'UnBookmark'
    button.disabled = false
    token('Bookmarked this item!')
}

async function unBookmark(button) {
    button.disabled = true
    await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .update({
            bookmarks: firebase.firestore.FieldValue.arrayRemove(documentID),
        })
    button.setAttribute('onclick', 'bookmark(this)')
    button.innerHTML = 'Bookmark'
    button.disabled = false
    token('Removed this item from bookmark collection!')
}

async function deleteContent() {
    const entries = userData['volunteer-entries']
    for (entry of entries) {
        if (entry.information.type != 'content') {
            continue
        }
        if (entry.information.reference.id === documentID) {
            await db
                .collection('users')
                .doc(localStorage.getItem('uid'))
                .update({
                    'volunteer-entries':
                        firebase.firestore.FieldValue.arrayRemove(entry),
                    'created-content':
                        firebase.firestore.FieldValue.arrayRemove(documentID),
                })
        }
    }
    if (contentData['file-name']) {
        await storageRef
            .child('content')
            .child(contentData.creator)
            .child(contentData['file-name'])
            .delete()
    }
    await db.collection('content').doc(documentID).delete()
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/delete-content', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            ids: [documentID],
        })
    )
    xhr.onload = async function () {
        if (this.response === 'false') {
            token('Something went wrong, please try again later')
            return
        }
        token('Your content has been successfully deleted!')
    }
}
