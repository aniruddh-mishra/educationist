var template = document.getElementById('card-template')
var holder = document.createElement('section')
document.querySelector('.main-body').appendChild(holder)
holder.id = 'cards'

const subjects = [
    'science',
    'math',
    'english',
    'python',
    'html/css/js',
    'chess',
    'philosophy',
    'scratch',
    'history',
]
var upvoted
var counter = 0
var limit = true

async function getContent() {
    const snapshot = await db
        .collection('content')
        .orderBy('upvotes', 'desc')
        .limit(40)
        .get()
    snapshot.forEach((doc) => {
        const data = doc.data()
        createCard(
            doc.id,
            `/content/document?id=${doc.id}`,
            data.title,
            data.subject,
            data.author,
            [data.type, data.age]
        )
    })
}

getContent()

function createCard(id, link, title, subject, author, tags) {
    var card = template.content.cloneNode(true)
    card.querySelector('.clickable').setAttribute(
        'onclick',
        'openLink("' + link + '")'
    )
    card.querySelector('.title').innerHTML = title
    if (!author) {
        author = 'Anonymous'
    }
    card.querySelector('.card-author').innerHTML = author
    card.getElementById('banner-image').setAttribute(
        'src',
        'https://cdn.educationisttutoring.org/images/content-curation/' +
            (subjects.indexOf(subject) + 1) +
            '.svg'
    )
    for (tag of tags) {
        a = document.createElement('a')
        a.innerHTML = tag
        card.getElementById('tags').appendChild(a)
    }
    b = document.createElement('button')
    b.innerHTML = '+'
    card.getElementById('tags').appendChild(b)
    card.querySelector('button').setAttribute(
        'onclick',
        'upvote("' + id + '", this)'
    )
    holder.appendChild(card)
}

async function search() {
    const query = document.getElementById('search').value
    if (query == '') {
        return getContent()
    }
    const client = algoliasearch(
        'M7ZXC6YNGS',
        '92c6702e4476ae4bd6246ecf3a75d8a0'
    )
    const index = client.initIndex('content_catalog')
    var results = await index.search(query)
    holder.innerHTML = ''
    if (results.hits == []) {
        holder.innerHTML = 'No results for your query'
    }
    for (result of results.hits) {
        createCard(
            result.objectID,
            `/content/document?id=${result.objectID}`,
            result.title,
            result.subject,
            result.author,
            [result.type, result.age]
        )
    }
}

function openLink(link) {
    window.open(link, '_blank').focus()
}

async function upvote(id, button) {
    try {
        await db
            .collection('content')
            .doc(id)
            .update({ upvotes: firebase.firestore.FieldValue.increment(1) })
    } catch {
        button.disabled = true
        document.getElementById('alert').innerHTML =
            'You can only upvote an item once!'
        document.getElementById('toaster').classList.toggle('invisible')
        setTimeout(() => {
            document.getElementById('toaster').classList.toggle('invisible')
        }, 5000)
        return
    }
    const doc = await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .get()

    db.collection('users')
        .doc(doc.id)
        .update({
            upvotes: firebase.firestore.FieldValue.arrayUnion(id),
        })

    button.disabled = true
    document.getElementById('alert').innerHTML =
        'You have successfully upvoted this item!'
    document.getElementById('toaster').classList.toggle('invisible')
    setTimeout(() => {
        document.getElementById('toaster').classList.toggle('invisible')
    }, 5000)
}
