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

async function upvoteHistory() {
    const snapshot = await db
        .collection('users')
        .where('eid', '==', localStorage.getItem('eid'))
        .get()
    for (doc of snapshot.docs) {
        const user = await db.collection('users').doc(doc.id).get()
        var upvoted = user.data()['upvote-content']
    }

    return upvoted
}

async function getContent() {
    upvoted = await upvoteHistory()
    snapshot = await db
        .collection('content')
        .orderBy('upvotes', 'desc')
        .limit(20)
        .get()
    snapshot.forEach((doc) => {
        const data = doc.data()
        createCard(doc.id, data.link, data.title, data.subject, data.author, [
            data.type,
            data.age,
        ])
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

// function refresh(ban) {
//     if (counter >= 2) {
//         if (limit) {
//             alert(
//                 'You have passed the refresh limit! All further refreshes will simply be filters'
//             )
//             limit = false
//         }
//         filter()
//         return
//     }

//     if (!ban) {
//         counter += 1
//         setTimeout(() => {
//             counter = 0
//             limit = true
//         }, 15 * 60 * 1000)
//     }

//     dbRef
//         .once('value', (data) => {
//             if (data.exists()) {
//                 contents = data.val()
//                 filter(ban)
//             } else {
//                 console.log('No data available')
//             }
//         })
//         .catch((error) => {
//             console.log(error)
//             alert(
//                 'Due to an unforseen error, we were unable to get you the data we needed to show you our content. If you are banned from Educationist Servers due to spam, please wait 15 days to try again!'
//             )
//         })
// }

// function filter(search) {
//     const tag = document.getElementById('search').value
//     const subjectSearch = document.getElementById('subjects').value
//     var cards = []
//     var subjects = []
//     for (subject in contents) {
//         subjects.push(subject)
//         if (
//             subjectSearch !== 'none' &&
//             subject.toLowerCase() !== subjectSearch.toLowerCase()
//         ) {
//             continue
//         }
//         var tags = [subject.toLowerCase()]
//         subject = contents[subject]
//         for (type in subject) {
//             tags.push(type.toLowerCase())
//             type = subject[type]
//             for (age in type) {
//                 tags.push(age)
//                 if (tag !== '' && !tags.includes(tag.toLowerCase())) {
//                     tags.splice(2, 1)
//                     continue
//                 }
//                 age = type[age]
//                 for (content in age) {
//                     content = age[content]
//                     const link = content[0]
//                     const title = content[1]
//                     cards.push(createCard(link, title, tags))
//                 }
//                 tags.splice(2, 1)
//             }
//             tags.splice(1, 1)
//         }
//         tags.splice(0, 1)
//     }
//     if (document.getElementById('not-found')) {
//         document.getElementById('not-found').remove()
//     }
//     if (cards.length === 0) {
//         var error = document.createElement('div')
//         error.id = 'not-found'
//         error.innerHTML =
//             'There were no matches for this search... Please try again with a different query.'
//         document.querySelector('.main-body').appendChild(error)
//     }
//     insertCards(cards, subjects, search)
// }

function openLink(link) {
    window.open(link, '_blank').focus()
}

async function upvote(id, button) {
    if (upvoted.includes(id)) {
        button.disabled = true
        return
    }
    db.collection('content')
        .doc(id)
        .update({ upvotes: firebase.firestore.FieldValue.increment(1) })
    const snapshot = await db
        .collection('users')
        .where('eid', '==', localStorage.getItem('eid'))
        .get()
    snapshot.forEach((doc) => {
        db.collection('users')
            .doc(doc.id)
            .update({
                'upvote-content': firebase.firestore.FieldValue.arrayUnion(id),
            })
    })
    upvoted.push(id)
    button.disabled = true
    console.log('Upvoted!')
}

// // document.getElementById('banner-image').setAttribute('src', 'https://cdn.educationisttutoring.org/images/content-curation/' + (Math.floor(Math.random() * 9) + 1) + '.svg')
