async function setUp() {
    const user = await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .get()
    const userData = user.data()
    const unsubscribed = userData.unsubscribe
    if (unsubscribed) {
        for (unsubscribe of unsubscribed) {
            const e = document.getElementById(unsubscribe)
            const start =
                e.innerHTML.indexOf('Unsubscribe') + 'Unsubscribe'.length
            e.innerHTML = 'Subscribe' + e.innerHTML.slice(start)
            e.setAttribute('onclick', 'subscribe(this)')
            e.classList.toggle('blue')
            e.classList.toggle('red')
        }
    }
    document.getElementById('button-container').classList.remove('temp')
}

setUp()

async function unSubscribe(e) {
    const unsubscribe = e.id
    await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .update({
            unsubscribe: firebase.firestore.FieldValue.arrayUnion(unsubscribe),
        })
    const start = e.innerHTML.indexOf('Unsubscribe') + 'Unsubscribe'.length
    e.innerHTML = 'Subscribe' + e.innerHTML.slice(start)
    e.setAttribute('onclick', 'subscribe(this)')
    e.classList.toggle('blue')
    e.classList.toggle('red')
    token('Unsubscribed!')
}

async function subscribe(e) {
    const subscribe = e.id
    await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .update({
            unsubscribe: firebase.firestore.FieldValue.arrayRemove(subscribe),
        })
    const start = e.innerHTML.indexOf('Subscribe') + 'Subscribe'.length
    e.innerHTML = 'Unsubscribe' + e.innerHTML.slice(start)
    e.setAttribute('onclick', 'unSubscribe(this)')
    e.classList.toggle('blue')
    e.classList.toggle('red')
    token('Subscribed!')
}
