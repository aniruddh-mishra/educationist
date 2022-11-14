var template = document.getElementById('card-template')
const client = algoliasearch('M7ZXC6YNGS', '92c6702e4476ae4bd6246ecf3a75d8a0')
const holder = document.getElementById('cards')
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
let bookmarks = []
let documentsCreated = []

async function specialContent() {
    const user = await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .get()
    documentsCreated = user.data()['created-content']
    if (documentsCreated && documentsCreated.length > 0) {
        const option = document.createElement('option')
        option.value = 'mid'
        option.innerHTML = 'My Content'
        document.getElementById('selector-filter').appendChild(option)
    }
    bookmarks = user.data().bookmarks
}

async function getContent(data, security) {
    if (data) {
        if (data.length === 0) {
            holder.innerHTML = 'You do not have any bookmarked items'
            return
        }
        if (security) {
            var snapshot = await db
                .collection('content')
                .where('__name__', 'in', data)
                .get()
        } else {
            var snapshot = await db
                .collection('content')
                .where('verified', '==', true)
                .where('__name__', 'in', data)
                .get()
        }
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
}

specialContent()
const urlParams = new URLSearchParams(window.location.search)
const searchQuery = urlParams.get('search')
if (searchQuery) {
    document.getElementById('search').value = searchQuery
    search()
} else {
    getContent()
}

function createCard(id, link, title, subject, author, tags) {
    let clickable = document.createElement('div')
    clickable.classList.add('clickable')

    let titleBlock = document.createElement('h3')
    titleBlock.classList.add('title')
    titleBlock.innerHTML = title

    let banner = document.createElement('div')
    banner.classList.add('banner')

    let image = document.createElement('img')
    image.src =
        'https://cdn.educationisttutoring.org/images/content-curation/' +
        (subjects.indexOf(subject) + 1) +
        '.svg'
    image.alt = 'Content Image'
    image.id = 'banner-image'

    banner.appendChild(image)

    if (!author) {
        author = 'Anonymous'
    }
    let authorTag = document.createElement('div')
    authorTag.innerHTML = author
    authorTag.classList.add('card-author')

    clickable.appendChild(titleBlock)
    clickable.appendChild(banner)
    clickable.appendChild(authorTag)

    let tagsDiv = document.createElement('div')
    tagsDiv.id = 'tags'
    for (const tag of tags) {
        tagElement = document.createElement('a')
        tagElement.innerHTML = tag
        tagsDiv.appendChild(tagElement)
    }

    let bookmarkButton = document.createElement('div')
    if (bookmarks != undefined && bookmarks.includes(id)) {
        bookmarkButton.innerHTML =
            '<img src="https://cdn.educationisttutoring.org/images/bookmark-filled.svg" alt="bookmark" />'
        bookmarkButton.setAttribute('onclick', 'unBookmark("' + id + '", this)')
    } else {
        bookmarkButton.innerHTML =
            '<img src="https://cdn.educationisttutoring.org/images/bookmark.svg" alt="bookmark" />'
        bookmarkButton.setAttribute('onclick', 'bookmark("' + id + '", this)')
    }

    tagsDiv.appendChild(bookmarkButton)

    let card = createBlock(false, [clickable, tagsDiv], 'small', id)
    card.querySelector('.clickable').setAttribute(
        'onclick',
        'openLink("' + link + '")'
    )

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
    notify('Bookmarked this item!', 2000)
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
    notify('Removed this item from bookmark collection!', 3000)
}

async function filterContent() {
    const selector = document.getElementById('selector-filter').value
    document.querySelector('.filter').setAttribute('style', 'display: none;')
    if (selector === 'true') {
        getContent(bookmarks)
    } else if (selector === 'mid') {
        getContent(documentsCreated, true)
    } else {
        getContent()
        document.querySelector('.filter').setAttribute('style', '')
    }
}
