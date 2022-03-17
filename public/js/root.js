var navigation = document.getElementById('navigation')

document.querySelector('body').classList.add('invisible')

if (navigation) {
    var header = document.createElement('header')
    header.innerHTML = `NAVIGATION`
    navigation.replaceWith(header)
}

const paths = {
    '/': document.getElementById('index-page'),
    '/content': document.getElementById('content-page'),
    '/classes': document.getElementById('classes-page'),
    '/content/document': document.getElementById('content-page'),
    '/logs': document.getElementById('logs-page'),
    '/admin': document.getElementById('admin-link'),
}

const underlineItem = paths[window.location.pathname]
if (underlineItem) {
    underlineItem.classList.add('selected')
}

var firebaseConfig = {
    apiKey: 'AIzaSyDf83xltbEW7NoN1PezsCgmtTQesxknfbM',
    authDomain: 'educationist-42b45.firebaseapp.com',
    projectId: 'educationist-42b45',
}

firebase.initializeApp(firebaseConfig)

var db = firebase.firestore()

firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        if (
            localStorage.getItem('uid') === null ||
            localStorage.getItem('uid') != user.uid
        ) {
            logout()
        }
        if (
            window.location.pathname === '/login' ||
            window.location.pathname === '/register'
        ) {
            const params = new URLSearchParams(window.location.search)
            if (params.has('path')) {
                window.location.replace(params.get('path'))
                return
            }
            window.location.replace('/')
        }

        var role = localStorage.getItem('role')
        if (role == undefined) {
            data = (await db.collection('users').doc(user.uid).get()).data()
            localStorage.setItem('role', data.role)
            localStorage.setItem('eid', data.eid)
            role = data.role
        } else if (localStorage.getItem('eid') == undefined) {
            data = (await db.collection('users').doc(user.uid).get()).data()
            localStorage.setItem('eid', data.eid)
        }

        if (role != 'admin') {
            document.getElementById('admin-link').remove()
        }
        if (window.location.pathname === '/admin' && role != 'admin') {
            logout()
        }
        if (localStorage.getItem('mode') === 'true') {
            document.getElementById('lightmode-btn').innerHTML = 'Dark Mode'
        }
        document.querySelector('body').classList.remove('invisible')
    } else {
        document.querySelector('.dropdown').remove()
        const r = document.querySelector(':root')
        r.style.setProperty('--navbar-width', '27em')
        document.querySelector('body').classList.remove('invisible')
        if (window.location.pathname !== '/login') {
            if (
                window.location.pathname === '/reset' ||
                window.location.pathname === '/register' ||
                window.location.pathname === '/create'
            ) {
                return
            }
            window.location.replace(
                '/login?path=' +
                    window.location.pathname +
                    window.location.search
            )
            return
        }
    }
})

function openMenu(value) {
    value.classList.toggle('change')
    document.querySelector('.navbar').classList.toggle('navbar-vertical')
    const title = document.querySelector('.title')
    if (title) {
        title.classList.toggle('invisible')
    }
    document.querySelector('.main-body').classList.toggle('invisible')
}

function accountPage() {
    var user = firebase.auth().currentUser
    if (user) {
        logout()
    }
}

function logout() {
    localStorage.clear()
    document.cookie = 'admin=; path=/;'
    firebase.auth().signOut()
}

function dropdown() {
    if (
        window.location.pathname == '/login' ||
        window.location.pathname == '/reset'
    ) {
        return
    }
    document.getElementById('myDropdown').classList.toggle('temp')
}

window.onclick = function (event) {
    if (!event.target.matches('.navbarBtn')) {
        var dropdowns = document.getElementsByClassName('dropdown-content')
        var i
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i]
            if (!openDropdown.classList.contains('temp')) {
                openDropdown.classList.add('temp')
            }
        }
    }
}

function token(message) {
    if (!document.getElementById('toaster').classList.contains('invisible')) {
        setTimeout(() => {
            token(message)
        }, 100)
        return
    }
    document.getElementById('alert').innerHTML = message
    document.getElementById('toaster').classList.toggle('invisible')
    setTimeout(() => {
        document.getElementById('toaster').classList.toggle('invisible')
    }, 3000)
}

function lightmode() {
    const mode = localStorage.getItem('lightmode')
    if (mode === 'true') {
        document.getElementById('lightmode-btn').innerHTML = 'Light Mode'
        localStorage.setItem('lightmode', 'false')
        var settings = {
            '--background': 'rgb(17, 19, 18)',
            '--basic-font': 'var(--educationist-green)',
            '--invert': 'white',
            '--background-standout': 'rgb(37, 41, 39)',
            '--background-block': 'rgb(30, 34, 32)',
            '--background-block-hover': 'var(--background-standout)',
            '--help-menu': 'var(--invert)',
        }
        document
            .getElementById('logo-img')
            .setAttribute(
                'src',
                'https://cdn.educationisttutoring.org/images/light-logos/educationist.png'
            )
        document
            .getElementById('theme')
            .setAttribute('content', 'rgb(17, 19, 18)')
    } else {
        localStorage.setItem('lightmode', 'true')
        document.getElementById('lightmode-btn').innerHTML = 'Dark Mode'
        document
            .getElementById('logo-img')
            .setAttribute(
                'src',
                'https://cdn.educationisttutoring.org/images/dark-logos/educationist.png'
            )
        var settings = {
            '--background': 'white',
            '--basic-font': 'black',
            '--invert': 'rgb(92, 90, 90)',
            '--background-standout': '#89cab6',
            '--background-block': 'rgb(30, 34, 32)',
            '--background-block-hover': 'rgb(37, 41, 39)',
            '--help-menu': 'var(--background-block)',
        }
        document.getElementById('theme').setAttribute('content', 'white')
    }
    var cssRoot = document.querySelector(':root')
    for (key of Object.keys(settings)) {
        cssRoot.style.setProperty(key, settings[key])
    }
}

function lowerCase(string) {
    var newString = ''
    for (character of string) {
        newString += character.toLowerCase()
    }
    return newString
}

function help() {
    document.getElementById('help').classList.add('invisible')
    document.getElementById('help-menu-container').classList.remove('invisible')
}

function closeHelp() {
    document.getElementById('help').classList.remove('invisible')
    document.getElementById('help-menu-container').classList.add('invisible')
}

window.addEventListener('load', () => {
    const mode = localStorage.getItem('lightmode')
    if (mode === 'true') {
        document.getElementById('lightmode-btn').innerHTML = 'Dark Mode'
        var cssRoot = document.querySelector(':root')
        const lightMode = {
            '--background': 'white',
            '--basic-font': 'black',
            '--invert': 'rgb(92, 90, 90)',
            '--background-standout': '#89cab6',
            '--background-block': 'rgb(30, 34, 32)',
            '--background-block-hover': 'rgb(37, 41, 39)',
            '--help-menu': 'var(--background-block)',
        }

        document
            .getElementById('logo-img')
            .setAttribute(
                'src',
                'https://cdn.educationisttutoring.org/images/dark-logos/educationist.png'
            )
        for (key of Object.keys(lightMode)) {
            cssRoot.style.setProperty(key, lightMode[key])
        }
    }
})
