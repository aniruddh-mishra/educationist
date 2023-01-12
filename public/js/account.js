bufferToggle()

function editValue(button) {
    button.classList.toggle('bi-pencil')
    button.classList.toggle('bi-check-lg')
    const input = button.parentNode.nextSibling.nextSibling
    input.classList.toggle('informer')
    input.disabled = !input.disabled
}

async function getData() {
    const user = (
        await db.collection('users').doc(localStorage.getItem('uid')).get()
    ).data()
    bufferToggle()
    document.getElementById('role').innerHTML = user.role
    document.getElementById('date').innerHTML = user.registration
        .toDate()
        .toDateString()
    document.getElementById('name').value = user.name
    document.getElementById('email').innerHTML = user.email
    const birthday = user.birthday.toDate()
    document.getElementById('birthday').value = birthday
        .toISOString()
        .split('T')[0]
    document.getElementById('username').innerHTML = user.eid
    document.getElementById('timezone').value = user.timezone
    const informers = document.querySelectorAll('.informer')
    for (const informer of informers) {
        informer.disabled = true
    }
}

async function save() {
    if (document.getElementById('name').value === '') {
        customAlert(
            'Your name must have atleast one alphabetical character',
            false,
            true
        )
        return
    }
    userUpdate = {
        name: document.getElementById('name').value,
        birthday: firebase.firestore.Timestamp.fromDate(
            new Date(document.getElementById('birthday').value)
        ),
        timezone: document.getElementById('timezone').value,
    }
    try {
        await db
            .collection('users')
            .doc(localStorage.getItem('uid'))
            .update(userUpdate)
    } catch {
        customAlert(
            'Something went wrong, please try again later.',
            false,
            true
        )
    }

    notify('Account information has been udpated!')
}

getData()
