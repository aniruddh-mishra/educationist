const params = new URLSearchParams(window.location.search)
let documentID = params.get('id')
let bookmarks = []
let upvotes = []
let owner = false
let userData
let contentData
document.getElementById('container').classList.add('invisible')

async function getData() {
    let content
    try {
        content = await db.collection('content').doc(documentID).get()
    } catch {
        notFound()
    }

    if (content.data() === undefined) {
        return notFound()
    }
    const user = await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .get()
    userData = user.data()
    bookmarks = userData.bookmarks
    upvotes = userData.upvotes

    if (bookmarks != undefined && bookmarks.includes(documentID)) {
        document.getElementById('bookmark-button').innerHTML = 'Unbookmark'
        document
            .getElementById('bookmark-button')
            .setAttribute('onclick', 'unBookmark(this)')
    }

    contentData = content.data()

    document.getElementById('preview').setAttribute('src', contentData.link)
    document.getElementById('expand').setAttribute(
        'onclick',
        `openLink("${contentData.link}"
        )`
    )
    if (contentData.author === null) {
        contentData.author = 'Anonymous'
    }
    document.getElementById('title').innerHTML = contentData.title
    document.getElementById(
        'author'
    ).innerHTML = `Author: ${contentData.author}`
    document.getElementById(
        'upvotes'
    ).innerHTML = `Upvotes: ${contentData.upvotes}`
    document.getElementById('age').innerHTML = `Age: ${contentData.age}`
    document.getElementById('subject').innerHTML = `Subject: ${capitalize(
        contentData.subject
    )}`
    document.getElementById('type').innerHTML = capitalize(contentData.type)
    if (
        contentData.creator === localStorage.getItem('uid') ||
        userData.role === 'admin'
    ) {
        owner = true
        const verified = document.createElement('p')
        verified.id = 'verified'
        const creator = await db
            .collection('users')
            .doc(contentData.creator)
            .get()
        if (creator.exists) {
            const eid = document.createElement('p')
            eid.innerHTML = 'Username: ' + creator.data().eid
            const email = document.createElement('p')
            email.innerHTML = 'Email Address: ' + creator.data().email
            document.getElementById('info').appendChild(eid)
            document.getElementById('info').appendChild(email)
        }
        if (contentData.verified) {
            verified.innerHTML = 'Verified'
        } else {
            verified.innerHTML = 'To Be Verified'
            if (userData.role === 'admin') {
                const button = document.createElement('button')
                button.innerHTML = 'Approve Content'
                button.classList.add('btn-normal')
                button.setAttribute('onclick', 'approveContent()')
                document.getElementById('report-form').appendChild(button)
            }
        }
        document.getElementById('info').appendChild(verified)
        const button = document.createElement('button')
        button.id = 'delete'
        button.innerHTML = 'Remove Content'
        button.classList = 'btn-red'
        button.setAttribute('onclick', 'deleteContent(this)')
        document.getElementById('report-form').appendChild(button)
    }
    document.getElementById('container').classList.remove('invisible')
}

getData()

async function report() {
    const problem = document.getElementById('report-text').value
    if (problem == '') {
        return notify('You must have something to report!')
    }
    await db.collection('reports').add({
        complete: false,
        text: problem,
        date: firebase.firestore.Timestamp.now(),
        user: localStorage.getItem('uid'),
        document: documentID,
    })
    notify('Your report has been sent!')
}

async function upvote() {
    if (upvotes.includes(documentID)) {
        return notify('You can only upvote an item once!')
    }
    try {
        await db
            .collection('content')
            .doc(documentID)
            .update({ upvotes: firebase.firestore.FieldValue.increment(1) })
    } catch {
        return notify('You can only upvote an item once!')
    }

    await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .update({
            upvotes: firebase.firestore.FieldValue.arrayUnion(documentID),
        })

    upvotes.push(documentID)

    let newUpvotes =
        parseInt(document.getElementById('upvotes').innerHTML.split(' ')[1]) + 1

    document.getElementById('upvotes').innerHTML = `Upvotes: ${newUpvotes}`

    notify('You have successfully upvoted this item!')
}

var form = document.getElementById('report-form')
function handleForm(event) {
    event.preventDefault()
}
form.addEventListener('submit', handleForm)

async function bookmark(button) {
    if (
        document.getElementById('verified') &&
        document.getElementById('verified').innerHTML != 'Verified'
    ) {
        return notify('This item must be verified before it can be bookmarked')
    }
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
    notify('Bookmarked this item!', 2000)
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
    notify('Removed this item from bookmark collection!')
}

async function deleteContent(button) {
    customAlert(
        'By continuing, you will delete all records of this content including all volunteer hours associated with the content.',
        async () => {
            if (contentData.creator) {
                ownerData = userData
                if (userData.role === 'admin') {
                    ownerData = (
                        await db
                            .collection('users')
                            .doc(contentData.creator)
                            .get()
                    ).data()
                }
                const entries = ownerData['volunteer-entries']
                for (entry of entries) {
                    if (entry.information.type != 'content') {
                        continue
                    }
                    if (entry.information.reference.id === documentID) {
                        await db
                            .collection('users')
                            .doc(contentData.creator)
                            .update({
                                'volunteer-entries':
                                    firebase.firestore.FieldValue.arrayRemove(
                                        entry
                                    ),
                                'created-content':
                                    firebase.firestore.FieldValue.arrayRemove(
                                        documentID
                                    ),
                            })
                        break
                    }
                }
            }

            if (contentData['file-name']) {
                try {
                    await storageRef
                        .child('content')
                        .child(contentData.creator)
                        .child(contentData['file-name'])
                        .delete()
                } catch {
                    notify(
                        'We were unable to delete the firebase document: ' +
                            contentData['file-name']
                    )
                }
            }

            await db.collection('content').doc(documentID).delete()
            request(
                '/delete-content',
                'POST',
                (response) => {
                    if (response === 'false') {
                        notify('Something went wrong, please try again later')
                        return
                    }
                    notify('Your content has been successfully deleted!')
                },
                {},
                {
                    ids: [documentID],
                }
            )
        }
    )
}

async function approveContent() {
    customAlert(
        'If you continue, you agree that this content meets the following criteria: 1. It is accurate, 2. It is accessible, 3. You are an Educationist admin. LOL',
        async () => {
            await db.collection('content').doc(documentID).update({
                verified: true,
            })

            contentData.verified = true
            contentData.objectID = documentID

            request(
                '/new-content',
                'POST',
                async (response) => {
                    if (response === 'false') {
                        await db.collection('content').doc(documentID).update({
                            verified: false,
                        })
                        contentData.verified = false
                        return notify(
                            'Something went wrong, please try again later'
                        )
                    }
                    notify(response)
                    document.getElementById('verified').innerHTML = 'Verified'
                },
                {},
                {
                    information: contentData,
                }
            )
        }
    )
}
