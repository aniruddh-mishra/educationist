const params = new URLSearchParams(window.location.search)
var documentID = params.get('id')

async function getData() {
    const content = await db.collection('content').doc(documentID).get()
    const data = content.data()
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
        text: problem,
        date: firebase.firestore.Timestamp.now(),
        user: localStorage.getItem('uid'),
        document: documentID,
    })
}

var form = document.getElementById('report-form')
function handleForm(event) {
    event.preventDefault()
}
form.addEventListener('submit', handleForm)
