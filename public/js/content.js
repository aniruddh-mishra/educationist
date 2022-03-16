var template = document.getElementById('card-template')
var holder = document.createElement('section')
document.querySelector('.main-body').appendChild(holder)
holder.id = 'cards'
const client = algoliasearch('M7ZXC6YNGS', '92c6702e4476ae4bd6246ecf3a75d8a0')

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
var bookmarks = []
var checked = false
var documentsCreated = []

async function getContent(data) {
    try {
        if (!checked) {
            const user = await db
                .collection('users')
                .doc(localStorage.getItem('uid'))
                .get()
            documentsCreated = user.data()['created-content']
            if (documentsCreated && documentsCreated.length > 0) {
                const option = document.createElement('option')
                option.value = 'mid'
                option.innerHTML = 'My Content'
                document.getElementById('bookmark-filter').appendChild(option)
            }
            bookmarks = user.data().bookmarks
            checked = true
        }
        if (data != undefined) {
            if (data.length === 0) {
                holder.innerHTML = 'You do not have any bookmarked items'
                return
            }
            var snapshot = await db
                .collection('content')
                .where('__name__', 'in', data)
                .get()
        } else {
            var snapshot = await db
                .collection('content')
                .where('verified', '==', true)
                .orderBy('upvotes', 'desc')
                .limit(30)
                .get()
        }

        holder.innerHTML = ''
        if (snapshot.empty) {
            holder.innerHTML = 'You do not have any bookmarked items'
        }

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
    } catch (e) {
        if (e.code === 'permission-denied') {
            alert(
                'You have been banned from the Educationist servers because of detected spam. If this is an error please contact Edcuationist via email.'
            )
            setTimeout(() => {
                window.location.replace('https://educationisttutoring.org')
            }, 10000)
            return
        }
    }
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
    if (bookmarks != undefined && bookmarks.includes(id)) {
        b.innerHTML =
            '<img src="https://cdn.educationisttutoring.org/images/bookmark-filled.svg" alt="bookmark" />'
        card.getElementById('tags').appendChild(b)
        card.querySelector('button').setAttribute(
            'onclick',
            'unBookmark("' + id + '", this)'
        )
    } else {
        b.innerHTML =
            '<img src="https://cdn.educationisttutoring.org/images/bookmark.svg" alt="bookmark" />'
        card.getElementById('tags').appendChild(b)
        card.querySelector('button').setAttribute(
            'onclick',
            'bookmark("' + id + '", this)'
        )
    }

    holder.appendChild(card)
}

async function search() {
    const query = document.getElementById('search').value
    if (query == '') {
        return getContent()
    }
    const index = client.initIndex('content_catalog')
    var results = await index.search(query)
    holder.innerHTML = ''
    if (results.hits.length === 0) {
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

async function bookmark(id, button) {
    button.disabled = true
    await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .update({
            bookmarks: firebase.firestore.FieldValue.arrayUnion(id),
        })
    bookmarks.push(id)
    button.setAttribute('onclick', 'unBookmark("' + id + '", this)')
    button.innerHTML =
        '<img src="https://cdn.educationisttutoring.org/images/bookmark-filled.svg" alt="bookmarked" />'
    button.disabled = false
    token('Bookmarked this item!')
}

async function unBookmark(id, button) {
    button.disabled = true
    await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .update({
            bookmarks: firebase.firestore.FieldValue.arrayRemove(id),
        })
    const index = bookmarks.indexOf(id)
    bookmarks.splice(index, 1)
    button.setAttribute('onclick', 'bookmark("' + id + '", this)')
    button.innerHTML =
        '<img src="https://cdn.educationisttutoring.org/images/bookmark.svg" alt="bookmark" />'
    button.disabled = false
    token('Removed this item from bookmark collection!')
}

async function bookmarkContent() {
    const selector = document.getElementById('bookmark-filter').value
    document.querySelector('.filter').classList.toggle('temp')
    if (selector === 'true') {
        getContent(bookmarks)
    } else if (selector === 'mid') {
        getContent(documentsCreated)
    } else {
        getContent()
    }
}
