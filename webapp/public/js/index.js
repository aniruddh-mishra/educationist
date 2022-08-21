// Initializes Important Global Variables
const start = new Event('start')
const guestPaths = ['', 'login', 'reset', 'register', 'create', 'donate']
const paths = {
    '': document.getElementById('index-page'),
    content: document.getElementById('content-page'),
    'content/document': document.getElementById('content-page'),
    logs: document.getElementById('logs-page'),
    admin: document.getElementById('admin-link'),
}
let path = window.location.pathname.replace(/^\/?|\/?$/g, '')
let profile
let uid
let mode
let db
let storageRef
let classesData

// Checks path
const underlineItem = paths[path]
if (underlineItem) {
    underlineItem.classList.add('selected')
}

// Checks if mode has been changed
if (!localStorage.getItem('mode')) {
    document.addEventListener('start', () => {
        document.querySelector('html').classList.remove('invisible')
        changeMode(mode)
    })
} else {
    document.querySelector('html').classList.remove('invisible')
    changeMode(localStorage.getItem('mode'))
}

// Makes any string lowercase
function lowerCase(string) {
    var newString = ''
    for (character of string) {
        newString += character.toLowerCase()
    }
    return newString
}

// Password Visibility
function passwordVisibility(element) {
    let input = element.previousSibling
    const type = input.getAttribute('type') === 'text' ? 'password' : 'text'
    input.setAttribute('type', type)
    if (type === 'password') {
        return element.setAttribute('class', 'bi bi-eye')
    }

    element.setAttribute('class', 'bi bi-eye-slash')
}

// Alert Function
function customAlert(information, handler, message) {
    document.getElementById('continue-alert').classList.remove('invisible')
    if (message) {
        document.getElementById('continue-alert').classList.add('invisible')
    }
    document.getElementById('alert-container').classList.remove('invisible')
    document.getElementById('alert-content').innerHTML = information
    document.getElementById('continue-alert').onclick = () => {
        document.getElementById('alert-container').classList.add('invisible')
        handler()
    }
}

document.getElementById('close-alert').onclick = () => {
    document.getElementById('alert-container').classList.add('invisible')
}

// Capitalize Function
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

// Not Found Function
function notFound() {
    request('/404.html', 'GET', (response) => {
        document.querySelector('html').remove()
        document.write(response)
    })
}

// Load Function
function bufferToggle() {
    document.querySelector('.navMenu').classList.toggle('blur')
    document.querySelector('footer').classList.toggle('blur')
    document.getElementById('container').classList.toggle('blur')
    document.getElementById('loader-container').classList.toggle('invisible')
    for (const input of document.querySelectorAll('body input, body button')) {
        input.disabled = document
            .querySelector('.navMenu')
            .classList.contains('blur')
    }
}

// Bottom Menu
function toggleBottomMenu() {
    document.querySelector('.bottom-menu').classList.toggle('invisible')
    document.querySelector('.bottom-btn').classList.toggle('invisible')
}

// Open Link
function openLink(link) {
    window.open(link, '_blank').focus()
}

// Open Menu
function openMenu() {
    document.getElementById('navbar').classList.toggle('navbar-vertical')
    document.getElementById('container').classList.toggle('invisible')
    document.querySelector('footer').classList.toggle('invisible')
}

// Requests Function
function request(address, method, handler, headers, body) {
    // Creates a request instance
    let xhr = new XMLHttpRequest()
    xhr.open(method, address, true)

    // Request Headers
    xhr.setRequestHeader('Content-Type', 'application/json')
    if (headers) {
        for (const header in headers) {
            xhr.setRequestHeader(header, headers[header])
        }
    }

    // Sends request with body (optional)
    if (body) {
        xhr.send(JSON.stringify(body))
    } else {
        xhr.send()
    }

    // Handles a response
    xhr.onload = function () {
        handler(this.response)
    }
}

// Notification function
function notify(message, duration) {
    // Default duration
    if (!duration) {
        duration = 5000
    }

    // Handles if existing alert
    if (
        !document.getElementById('notification').classList.contains('invisible')
    ) {
        return setTimeout(() => {
            notify(message, duration)
        }, 500)
    }

    // Sets alert
    document.getElementById('alert').innerHTML = message
    document.getElementById('notification').classList.remove('invisible')
    setTimeout(() => {
        document.getElementById('notification').classList.add('invisible')
    }, duration)
}

// Logout Function
function logout() {
    localStorage.clear()
    firebase.auth().signOut()
    if (guestPaths.includes(path)) {
        window.location.reload()
    }
}

// Open Dropdown
function dropDownMenu(element) {
    element.nextElementSibling.classList.toggle('invisible')
}

window.onclick = function (event) {
    if (!event.target.matches('.dropdown-btn')) {
        var dropdowns = document.getElementsByClassName('dropdown-content')
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i]
            openDropdown.classList.add('invisible')
        }
    }
}

// Firebase initialize
function firebaseInit() {
    let firebaseConfig = {
        apiKey: 'AIzaSyDf83xltbEW7NoN1PezsCgmtTQesxknfbM',
        authDomain: 'educationist-42b45.firebaseapp.com',
        projectId: 'educationist-42b45',
    }
    firebase.initializeApp(firebaseConfig)

    // Initializes database and storage variables
    db = firebase.firestore()
    const storage = firebase
        .app()
        .storage('gs://educationist-42b45.appspot.com/')
    storageRef = storage.ref()
    firebase.auth().onAuthStateChanged(firebaseAuthChange)
}

// AuthChange handler for firebase login
async function firebaseAuthChange(user) {
    if (user) {
        if (
            localStorage.getItem('uid') === null ||
            localStorage.getItem('uid') != user.uid
        ) {
            logout()
        }
        if (
            window.location.pathname === '/login' ||
            window.location.pathname === '/register' ||
            window.location.pathname === '/create'
        ) {
            const params = new URLSearchParams(window.location.search)
            if (params.has('path')) {
                window.location.replace(params.get('path'))
                return
            }
            window.location.replace('/')
        }
        activatePage()
    } else {
        localStorage.clear()
        if (path === '') {
            fetchHome()
        } else if (!guestPaths.includes(path)) {
            window.location.replace(
                '/login?path=' +
                    window.location.pathname +
                    window.location.search
            )
        } else {
            activatePage()
        }
    }
}

function activatePage() {
    document.querySelector('body').classList.remove('invisible')
}

// Main Website Logged Out
function fetchHome() {
    request('/home', 'GET', (response) => {
        document.querySelector('html').remove()
        document.write(response)
        activatePage()
    })
}

// Called on load to initialize mode
function changeMode(selectedMode) {
    const theme = modes[selectedMode]
    for (const attribute in theme) {
        cssRoot.style.setProperty(attribute, theme[attribute])
    }
}

// Sets the classes in the menu and adds classes to data
function setClasses() {
    const data = JSON.stringify({
        uid: uid,
        name: profile.name,
        email: profile.email,
        student: profile.role === 'student' ? 'true' : 'false',
    })
    request(
        '/classes',
        'POST',
        (response) => {
            classesData = JSON.parse(response)
            if (!classesData.length) {
                document.querySelector('.merge-container').remove()
                document.querySelector('#classesDropDown').innerHTML =
                    'You are not currently registered in any classes.'
                return
            }

            if (profile.role === 'student') {
                document.querySelector('.merge-container').remove()
                document.querySelector('.class-merge').remove()
            }

            document.querySelector('#temp-classes').remove()

            let inactiveClasses = []
            let activeClasses = []
            let counter = 1
            for (classItem of classesData) {
                if (classItem.data.inactive) {
                    inactiveClasses.push(classItem)
                    continue
                }
                activeClasses.push(classItem)
                var nickName = 'Class #' + counter
                if (classItem.data.nickName) {
                    nickName = classItem.data.nickName
                }
                const option = document.createElement('option')
                option.value = classItem.id
                option.innerHTML = nickName
                document.getElementById('class1').appendChild(option)
                const option2 = document.createElement('option')
                option2.value = classItem.id
                option2.innerHTML = nickName
                document.getElementById('class2').appendChild(option2)
                classData[classItem.id] = classItem.data
                var newClass = document.createElement('a')
                newClass.id = 'class-link'
                newClass.href = '/class/' + classItem.id
                newClass.innerHTML = nickName
                document.getElementById('classes-list').appendChild(newClass)

                counter += 1
            }

            // Adds classes to the classes menu
            counter = 1
            for (classItem of inactiveClasses) {
                var nickName = 'Inactive Class #' + counter
                if (classItem.data.nickName) {
                    nickName = classItem.data.nickName
                }
                inactiveClassData[classItem.id] = classItem.data
                var newClass = document.createElement('a')
                newClass.id = 'class-link'
                newClass.href = '/class/' + classItem.id
                newClass.innerHTML = nickName
                document.getElementById('classes-list').appendChild(newClass)
                counter += 1
            }
        },
        false,
        data
    )
}

// Creates Blocks
function createBlock(title, sections, size, blockId) {
    let block = document.createElement('div')
    block.classList.add('block')
    block.classList.add(size)
    if (blockId) {
        block.id = blockId
    }
    if (title) {
        let titleBlock = document.createElement('h3')
        titleBlock.classList.add('title')
        titleBlock.innerHTML = title
        block.appendChild(titleBlock)
    }
    for (const section of sections) {
        block.appendChild(section)
    }
    return block
}

firebaseInit()
