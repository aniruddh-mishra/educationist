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
    return element.value
}

function signIn(username, password) {
    // Requests email from server
    request(
        '/login',
        'POST',
        (response) => {
            // Receives email from server based on eid
            const email = response
            firebase
                .auth()
                .signInWithEmailAndPassword(email, password)
                .then((user) => {
                    var uid = user.user.uid
                    localStorage.setItem('uid', uid)
                })
                .catch((error) => {
                    console.log(error)
                    bufferToggle()
                })
        },
        {},
        {
            eid: username,
        }
    )
}

async function register() {
    bufferToggle()
    let username = validate(document.getElementById('username'))
    let password = validate(document.getElementById('password'))
    let confirmPassword = validate(document.getElementById('password-confirm'))
    if (!(username && password && confirmPassword)) {
        document.getElementById('submit').disabled = false
        bufferToggle()
        return
    }

    username = lowerCase(username.trim())

    if (password != confirmPassword) {
        notify('Both passwords must match')
        bufferToggle()
        return
    }

    if (password.length <= 6) {
        notify(
            'This password is too short. Make sure to have atleast 6 characters.'
        )
        bufferToggle()
        return
    }

    const urlParams = new URLSearchParams(window.location.search)

    request(
        '/create',
        'POST',
        (response) => {
            bufferToggle()
            if (response === 'true') {
                notify('Account was successfully created!')
                signIn(username, password)
            } else if (response === 'error') {
                customAlert(
                    'This confirm token was already used to create an account.',
                    () => {},
                    true
                )
                document.getElementById('submit').disabled = true
            } else if (response === 'false') {
                notify('This username is already used!')
                document.getElementById('username').innerHTML = ''
                validate(document.getElementById('username'))
            } else if (response === 'expired') {
                customAlert(
                    'This token expired. Please register again!',
                    () => {},
                    true
                )
                document.getElementById('submit').disabled = true
            } else if (response === 'used') {
                customAlert(
                    'You have already created an account with this email!',
                    () => {},
                    true
                )
                document.getElementById('submit').disabled = true
            } else {
                customAlert(
                    'There was a problem creating your account. Please try again later.',
                    () => {},
                    true
                )
                document.getElementById('submit').disabled = true
            }
        },
        {},
        {
            code: urlParams.get('confirm'),
            eid: username,
            password: password,
        }
    )
}

const form = document.getElementById('register')
function handleForm(event) {
    event.preventDefault()
}
form.addEventListener('submit', handleForm)
