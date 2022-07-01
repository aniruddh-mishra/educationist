async function upload() {
    document.getElementById('submit').disabled = true
    var name = validate(document.getElementById('name'))
    var birthday = validate(document.getElementById('birthday'))
    var email = validate(document.getElementById('email'))
    var role = validate(document.getElementById('role'))
    var timezone = validate(document.getElementById('timezone'))

    if (!(name && birthday && email && role && timezone)) {
        document.getElementById('submit').disabled = false
        return
    }

    name = document.getElementById('name').value
    birthday = new Date(document.getElementById('birthday').value)
    email = lowerCase(document.getElementById('email').value.trim())
    role = document.getElementById('role').value
    timezone = document.getElementById('timezone').value

    const msPerYear = 1000 * 60 * 60 * 24 * 365

    if (role === 'tutor' && (Date.now() - birthday) / msPerYear < 13) {
        token('You must be at least 13 to be a tutor!')
        setTimeout(() => {
            alert(
                'You are about to be redirected to the educationist tutoring home page!'
            )
            setTimeout(() => {
                window.location.replace('https://educationisttutoring.org')
            }, 3000)
        }, 5000)
        return
    }

    if (
        role === 'student' &&
        (Date.now() - birthday) / msPerYear < 13 &&
        document.getElementById('email-header').innerHTML == 'Email'
    ) {
        token(
            "You must acquire parent permission. Fill in your parent's email address to continue"
        )
        document.getElementById('email-header').innerHTML = 'Parent Email'
        document.getElementById('email').value = ''
        document.getElementById('submit').disabled = false
        return
    }

    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/register', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            name: name,
            birthday: birthday,
            email: email,
            role: role,
            timezone: timezone,
            timestamp: new Date(Date.now()),
        })
    )

    xhr.onload = function () {
        var confirm = this.response
        if (confirm == 'true') {
            document.querySelector('.main-body').innerHTML = ''
            const title = document.createElement('h1')
            title.innerHTML = 'Please confirm your account to log in...'
            const information = document.createElement('p')
            information.innerHTML =
                'You should have gotten an email (check spam) to confirm your account. You will not be able to log in without this.'
            document.querySelector('.main-body').appendChild(title)
            document.querySelector('.main-body').appendChild(information)
        } else if (this.response === 'used') {
            token('This email is already taken, please use another one!')
            document.getElementById('submit').disabled = false
        } else {
            token('Something went wrong, please try again later!')
            document.getElementById('submit').disabled = true
        }
    }
}

function validate(element) {
    if (element.value === '') {
        element.classList.add('error-decorator')
        return false
    }
    var re = /\S+@\S+\.\S+/
    if (element.id === 'email' && !re.test(element.value)) {
        element.classList.add('error-decorator')
        return false
    }
    element.classList.remove('error-decorator')
    return true
}

const form = document.getElementById('register')
function handleForm(event) {
    event.preventDefault()
}
form.addEventListener('submit', handleForm)
