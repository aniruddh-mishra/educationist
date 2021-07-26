const dbRef = firebase.database().ref('Content Catalog/');
var template = document.getElementById('card-template');
refresh(true)

var contents;
var counter = 0

function refresh(ban) {
    if (counter >= 5) {
        alert('You have passed the refresh limit! Try again in five minutes')
        return
    }
    
    if(!ban) {
        counter += 1
        setTimeout(() => {
            counter = 0
        }, 5 * 60 * 1000)
    }

    dbRef.once('value', (data) => {
        if (data.exists()) {
            contents = data.val()
            filter()
        } else {
            console.log("No data available");
        }
    })
    .catch(error => {
        console.log(error);
        alert('Due to an unforseen error, we were unable to get you the data we needed to show you our content. If you are banned from Educationist Servers due to spam, please wait 15 days to try again!')
    })
}

function filter() {
    const tag = document.getElementById('search').value;
    const subjectSearch = document.getElementById('subjects').value;
    var cards = []
    var subjects = []
    for (subject in contents) {
        if (subjectSearch !== 'none' && subject.toLowerCase() !== subjectSearch.toLowerCase()) {
            continue
        }
        subjects.push(subject)
        var tags = [subject.toLowerCase()]
        subject = contents[subject]
        for (type in subject) {
            tags.push(type.toLowerCase())
            type = subject[type]
            for (age in type) {
                tags.push(age)
                if (tag !== '' && !tags.includes(tag.toLowerCase())) {
                    continue
                }
                age = type[age]
                for (content in age) {
                    content = age[content]
                    const link = content[0]
                    const title = content[1]
                    cards.push(createCard(link, title, tags))
                }
                tags.splice(2, 1)
            }
            tags.splice(1, 1)
        }
        tags.splice(0, 1)
    }
    if (cards.length === 0) {
        var error = document.createElement('div')
        error.innerHTML = 'There were no matches for this search... Please try again with a different query.'
        document.querySelector('.main-body').appendChild(error)
    }
    insertCards(cards, subjects)
}

function insertCards(cards, subjects) {
    var holder = document.getElementById('cards')
    if (holder) {
        holder.remove()
    }
    holder = document.createElement('section')
    holder.id = 'cards'
    for (card of cards) {
        holder.appendChild(card)
    }
    document.querySelector('.main-body').appendChild(holder)
    var subjectHolder = document.getElementById('subjects')
    for (subject of subjects) {
        var option = document.createElement('option');
        option.setAttribute('value', subject.toLowerCase());
        option.innerHTML = subject
        subjectHolder.appendChild(option)
    }
}

function createCard(link, title, tags) {
    var card = template.content.cloneNode(true);
    card.querySelector('.card').setAttribute('onclick', 'openLink("' + link + '")')
    card.querySelector('.title').innerHTML = title
    card.getElementById('banner-image').setAttribute('src', 'https://cdn.educationisttutoring.org/images/content-curation/' + (Math.floor(Math.random() * 9) + 1) + '.svg')
    for (tag of tags) {
        a = document.createElement('a')
        a.innerHTML = tag
        card.getElementById('tags').appendChild(a)
    }
    return card
}

function openLink(link) {
    window.open(link, '_blank').focus();
}

// document.getElementById('banner-image').setAttribute('src', 'https://cdn.educationisttutoring.org/images/content-curation/' + (Math.floor(Math.random() * 9) + 1) + '.svg')