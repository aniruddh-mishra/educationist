function nextPage() {
    const nameElm = document.getElementById('name')
    const name = validate(nameElm)

    const emailElm = document.getElementById('email')
    const email = validate(emailElm)

    const roleElm = document.getElementById('role')
    const role = validate(roleElm)

    if (!(name && email && role)) {
        customAlert('You must have a valid item in each field', () => {}, true)
        return
    }

    if (role === 'student') {
        document.getElementById('consent-container').classList.add('invisible')
        document
            .getElementById('parent-consent-container')
            .classList.remove('invisible')
    } else {
        document
            .getElementById('parent-consent-container')
            .classList.add('invisible')
        document
            .getElementById('consent-container')
            .classList.remove('invisible')
    }

    document.getElementById('part1').classList.add('invisible')
    document.getElementById('part2').classList.remove('invisible')
}

function backPage() {
    document.getElementById('part1').classList.remove('invisible')
    document.getElementById('part2').classList.add('invisible')
}

async function register() {
    if (
        !(
            document.getElementById('consent').checked ||
            document.getElementById('parent-consent').checked
        )
    ) {
        return customAlert(
            'You must agree to terms and conditions to register.',
            () => {},
            true
        )
    }
    bufferToggle()
    const nameElm = document.getElementById('name')
    const name = validate(nameElm)

    const emailElm = document.getElementById('email')
    const email = validate(emailElm)

    const roleElm = document.getElementById('role')
    const role = validate(roleElm)

    const birthdayElm = document.getElementById('birthday')
    let birthday
    if (validate(birthdayElm)) {
        birthday = new Date(validate(birthdayElm))
    }

    const timezoneElm = document.getElementById('timezone')
    const timezone = validate(timezoneElm)

    if (!(name && birthday && email && role && timezone)) {
        bufferToggle()
        customAlert('You must have a valid item in each field', () => {}, true)
        return
    }

    const msPerYear = 1000 * 60 * 60 * 24 * 365

    if (role === 'tutor' && (Date.now() - birthday) / msPerYear < 13) {
        bufferToggle()
        customAlert('You must be at least 13 to be a tutor!', () => {}, true)
        setTimeout(() => {
            window.location.replace('/')
        }, 3000)
        return
    }

    let unsubscribe = false

    if (!document.getElementById('newsletter-consent').checked) {
        unsubscribe = ['newsletter']
    }

    request(
        '/register',
        'POST',
        (response) => {
            if (response == 'true') {
                document.getElementById('container').innerHTML = ''
                const title = document.createElement('h1')
                title.innerHTML = 'Please confirm your account to log in'
                const information = document.createElement('p')
                information.innerHTML =
                    'You should have gotten an email (check spam) to confirm your account. You will not be able to log in without this.'
                document.getElementById('container').appendChild(title)
                document.getElementById('container').appendChild(information)
                bufferToggle()
            } else if (response === 'used') {
                bufferToggle()
                customAlert(
                    'This email is already taken, please use another one!',
                    () => {},
                    true
                )
                emailElm.value = ''
                validate(emailElm)
                backPage()
            } else {
                notify('Something went wrong, please try again later!')
                document.getElementById('submit').disabled = true
            }
        },
        {},
        {
            name: name,
            birthday: birthday,
            email: email,
            role: role,
            timezone: timezone,
            timestamp: new Date(Date.now()),
            unsubscribe: unsubscribe,
        }
    )
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
    return element.value
}

const form = document.getElementById('register')
function handleForm(event) {
    event.preventDefault()
}
form.addEventListener('submit', handleForm)
