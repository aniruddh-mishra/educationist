const params = new URLSearchParams(window.location.search)
const code = params.get('code')

if (!code) {
    document.querySelector('.main-body').innerHTML =
        'Something went wrong, please try again later... Redirecting'
    setTimeout(() => {
        window.location.replace('/')
    }, 5000)
} else {
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/discord/auth', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            uid: localStorage.getItem('uid'),
            code: code,
        })
    )
    xhr.onload = function () {
        if (this.response === 'false') {
            document.querySelector('.main-body').innerHTML =
                'Something went wrong, please try again later... Redirecting'
        } else {
            window.location.replace('/')
        }
    }
}
