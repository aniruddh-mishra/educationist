function next() {
    if (
        !(
            validate(document.getElementById('name')) &&
            validate(document.getElementById('birthday')) &&
            validate(document.getElementById('email')) &&
            validate(document.getElementById('role'))
        )
    ) {
        return
    }
}

function validate(element) {
    if (element.value == '' || element.value == 'none') {
        element.classList.add('error-decorator')
        return true
    }
    element.classList.remove('error-decorator')
}

var form = document.getElementById('register1')
function handleForm(event) {
    event.preventDefault()
}
form.addEventListener('submit', handleForm)
