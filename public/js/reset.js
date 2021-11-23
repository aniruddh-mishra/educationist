// Resets password upon submission
function resetPassword() {
    // Sets loading configurations
    document.getElementById('container').classList.add('blur')
    document
        .getElementById('loader-container')
        .classList.replace('loader-none', 'loader-container')

    // Gets value of email
    const email = document.getElementById('email').value

    // Validates email
    if (email === '') {
        // Removes loading configuration
        document.getElementById('container').classList.remove('blur')
        document
            .getElementById('loader-container')
            .classList.replace('loader-container', 'loader-none')
        return
    }

    // Sends request to reset password for email
    // Creates http request instance
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/reset', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            email: email,
        })
    )
    xhr.onload = function () {
        const response = this.response

        // Sets error based on response result
        if (response == 'Success') {
            document.getElementById('error').innerText =
                'Check your email for a link to reset your password!'
        } else if (response == 'Failure') {
            alert('Something went wrong, please try again later!')
        } else {
            document.getElementById('error').innerText =
                'This email does not seem to exist in our database. Make sure to use the email you registered with!'
        }

        // Removes loading configurations
        document.getElementById('container').classList.remove('blur')
        document
            .getElementById('loader-container')
            .classList.replace('loader-container', 'loader-none')
    }
}

function validate() {
    // Validates on keyup
    if (document.getElementById('email').value !== '') {
        document.getElementById('email').classList.remove('error-decorator')
    } else {
        document.getElementById('email').classList.add('error-decorator')
    }
}
