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
    if (!(await verify(document.getElementById('email').value))) {
        document.getElementById('submit').disabled = false
        return
    }
    name = document.getElementById('name').value
    birthday = new Date(document.getElementById('birthday').value)
    email = document.getElementById('email').value
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
            token('Please check your email to confirm this account!')
            setTimeout(() => {
                window.location.replace('/login')
            }, 10000)
        } else {
            token('Something went wrong, please try again later!')
            document.getElementById('submit').disabled = true
        }
    }
}

function verify(email) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest()
        xhr.open('POST', '/verify', true)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(
            JSON.stringify({
                email: email,
            })
        )
        xhr.onload = function () {
            var confirm = this.response
            if (confirm == 'true') {
                resolve(true)
            } else {
                token('This email is already taken, please use another one!')
                resolve(false)
            }
        }
    })
}

function validate(element) {
    if (element.value == '') {
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
