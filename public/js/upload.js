const storage = firebase.app().storage('gs://educationist-42b45.appspot.com/')
const storageRef = storage.ref()

async function create() {
    if (!checkFields()) {
        token('You must first fill out all the fields.')
        return false
    }
    var user = await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .get()
    user = user.data()
    var author = 'Anonymous'
    if (document.getElementById('display-name').value === 'true') {
        author = user.name
    }
    if (document.getElementById('file-type').value === 'upload') {
        const fileBtn = document.getElementById('file')
        const file = fileBtn.files[0]
        if (file.size > 5 * 1024 * 1024) {
            token('This file is too large to upload')
            fileBtn.value = ''
        }
        const ref = storageRef.child(
            '/content/' + localStorage.getItem('uid') + '/' + file.name
        )
        var upload = ref.put(file)
        upload.on('state_change', async (snapshot) => {
            const percentage =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            document.querySelector('progress').value = percentage
        })
        await upload
        var link = await ref.getDownloadURL()
        var upload = true
        var name = file.name
    } else {
        var link = document.getElementById('link').value
        var upload = false
    }
    var content = {
        age: document.getElementById('age').value,
        author: author,
        creator: localStorage.getItem('uid'),
        date: firebase.firestore.Timestamp.fromMillis(Date.now()),
        link: link,
        subject: document.getElementById('subject').value,
        title: document.getElementById('title').value,
        type: document.getElementById('type-content').value,
        upvotes: 0,
        verified: false,
    }
    if (upload) {
        content['file-name'] = name
    }
    const contentId = await db.collection('content').add(content)
    const entry = {
        date: firebase.firestore.Timestamp.fromMillis(
            new Date(Date.now()).getTime()
        ),
        minutes: parseInt(document.getElementById('minutes').value.trim()),
        information: {
            type: 'content',
            reference: contentId,
        },
    }

    if (this.response === 'false') {
        token(
            'Something went wrong, please contact educationist for further assistance'
        )
    }

    await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .update({
            'volunteer-entries':
                firebase.firestore.FieldValue.arrayUnion(entry),
            'created-content': firebase.firestore.FieldValue.arrayUnion(
                contentId.id
            ),
        })

    token('Congratulations, your content has been successfully uploaded!')
    setTimeout(() => {
        window.location.replace('/content/document?id=' + contentId.id)
    }, 100)
}

function checkFields() {
    const fields = [
        'title',
        'subject',
        'type-content',
        'age',
        'display-name',
        'minutes',
        'file-type',
        'link',
        'file',
    ]
    var returnItem = true
    for (field of fields) {
        if (!checkField(document.getElementById(field))) {
            returnItem = false
        }
    }
    return returnItem
}

function checkField(element) {
    if (element.classList.contains('temp')) {
        return true
    }
    if (element.value === '') {
        element.classList.add('error')
        return false
    } else {
        element.classList.remove('error')
        return true
    }
}

function fileChange(e) {
    e.classList.remove('error')
    if (e.value === 'link') {
        document.getElementById('link').classList.remove('temp')
        document.getElementById('file').classList.add('temp')
        document.getElementById('progress').classList.add('temp')
    } else {
        document.getElementById('link').classList.add('temp')
        document.getElementById('progress').classList.remove('temp')
        document.getElementById('file').classList.remove('temp')
    }
}

const form = document.getElementById('content-upload')
function handleForm(event) {
    event.preventDefault()
}
form.addEventListener('submit', handleForm)
