const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)

var xhr = new XMLHttpRequest()
xhr.open('POST', '/zoho', true)
xhr.setRequestHeader('Content-Type', 'application/json')
xhr.send(
    JSON.stringify({
        code: urlParams.get('code'),
    })
)
xhr.onload = async function () {
    const response = JSON.parse(this.response)
    if (!response['access_token']) {
        alert('Something went wrong, try again later!')
        return
    }
    localStorage.setItem('zoho_token', response['access_token'])
    window.close()
}
