var userData = false
var classData = {}
var inactiveClassData = {}

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
    '/content/document': document.getElementById('content-page'),
    '/logs': document.getElementById('logs-page'),
    '/admin': document.getElementById('admin-link'),
    '/content/': document.getElementById('content-page'),
    '/content/document/': document.getElementById('content-page'),
    '/logs/': document.getElementById('logs-page'),
    '/admin/': document.getElementById('admin-link'),
}

const lightMode = {
    '--background': 'white',
    '--basic-font': 'black',
    '--invert': 'rgb(92, 90, 90)',
    '--background-standout': '#89cab6',
    '--background-block': 'rgb(30, 34, 32)',
    '--background-block-hover': 'rgb(37, 41, 39)',
    '--help-menu': 'var(--background-block)',
    '--scroll-bar-color': 'var(--background-standout)',
}

const darkMode = {
    '--background': 'rgb(17, 19, 18)',
    '--basic-font': 'var(--educationist-green)',
    '--invert': 'white',
    '--background-standout': 'rgb(37, 41, 39)',
    '--background-block': 'rgb(30, 34, 32)',
    '--background-block-hover': 'var(--background-standout)',
    '--help-menu': 'var(--invert)',
    '--scroll-bar-color': 'var(--background-standout)',
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
            userData = data
            localStorage.setItem('role', data.role)
            localStorage.setItem('eid', data.eid)
            role = data.role
        } else if (localStorage.getItem('eid') == undefined) {
            data = (await db.collection('users').doc(user.uid).get()).data()
            userData = data
            localStorage.setItem('eid', data.eid)
        }

        if (role === 'student') {
            if (document.getElementById('tutor-menu'))
                document.getElementById('tutor-menu').remove()
        } else {
            if (document.getElementById('student-menu'))
                document.getElementById('student-menu').remove()
        }

        if (role != 'admin') {
            document.getElementById('admin-link').remove()
        }
        if (
            (window.location.pathname === '/admin' ||
                window.location.pathname === '/admin/') &&
            role != 'admin'
        ) {
            logout()
        }
        if (localStorage.getItem('mode') === 'true') {
            document.getElementById('lightmode-btn').innerHTML = 'Dark Mode'
        }
        document.querySelector('body').classList.remove('invisible')
        classes()
    } else {
        document.querySelector('.dropdown').parentNode.remove()
        document.querySelector('.dropdown').parentNode.remove()
        document.querySelector('#logs-page').parentNode.remove()
        const r = document.querySelector(':root')
        r.style.setProperty('--navbar-width', '18rem')
        document.querySelector('body').classList.remove('invisible')
        if (window.location.pathname !== '/login') {
            if (
                window.location.pathname === '/reset' ||
                window.location.pathname === '/register' ||
                window.location.pathname === '/create' ||
                window.location.pathname === '/donate' ||
                window.location.pathname === '/reset/' ||
                window.location.pathname === '/register/' ||
                window.location.pathname === '/create/' ||
                window.location.pathname === '/donate/'
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
    const state = document
        .querySelector('.navbar')
        .classList.contains('navbar-vertical')
    if (!state) {
        value.classList.add('change')
        document.querySelector('.navbar').classList.add('navbar-vertical')
        const title = document.querySelector('.title')
        if (title) {
            title.classList.add('invisible')
        }
        document.querySelector('.main-body').classList.add('invisible')
    } else {
        value.classList.remove('change')
        document.querySelector('.navbar').classList.remove('navbar-vertical')
        const title = document.querySelector('.title')
        if (title) {
            title.classList.remove('invisible')
        }
        document.querySelector('.main-body').classList.remove('invisible')
    }
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
    if (
        window.location.pathname === '/donate/' ||
        window.location.pathname === '/donate'
    ) {
        window.location.reload()
    }
}

function dropdown(option) {
    if (
        window.location.pathname == '/login' ||
        window.location.pathname == '/reset'
    ) {
        return
    }
    if (option) {
        document.getElementById('myDropdown').classList.add('temp')
        document.getElementById('classesDropDown').classList.toggle('temp')
    } else {
        document.getElementById('classesDropDown').classList.add('temp')
        document.getElementById('myDropdown').classList.toggle('temp')
    }
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

function token(message, duration) {
    if (!duration) {
        duration = 5000
    }
    if (!document.getElementById('toaster').classList.contains('invisible')) {
        return setTimeout(() => {
            token(message, duration)
        }, 500)
    }
    document.getElementById('alert').innerHTML = message
    document.getElementById('toaster').classList.remove('invisible')
    setTimeout(() => {
        document.getElementById('toaster').classList.add('invisible')
    }, duration)
}

function lightmode() {
    const mode = localStorage.getItem('lightmode')
    if (mode === 'true') {
        document.getElementById('lightmode-btn').innerHTML = 'Light Mode'
        localStorage.setItem('lightmode', 'false')
        var settings = darkMode
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
        var settings = lightMode
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
        document.getElementById('theme').setAttribute('content', 'white')
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

async function classes() {
    const uid = localStorage.getItem('uid')

    if (!userData) {
        userData = (await db.collection('users').doc(uid).get()).data()
    }

    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/classes', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            uid: uid,
            name: userData.name,
            email: userData.email,
            student: userData.role === 'student' ? 'true' : 'false',
        })
    )
    xhr.onload = function () {
        const data = JSON.parse(this.response)

        if (data.length === 0) {
            document.querySelector('.class-merge').remove()
            document.getElementById('all-classes').remove()
            document.querySelector('#classesDropDown').innerHTML =
                'You are not currently registered in any classes.'
            return
        }

        if (userData.role === 'student') {
            document.querySelector('.class-merge').remove()
        }
        var counter = 1
        var inactiveClasses = []
        document.querySelector('#temp-classes').remove()
        for (classItem of data) {
            if (classItem.data.inactive) {
                inactiveClasses.push(classItem)
                continue
            }
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

        if (
            window.location.pathname === '/classes' ||
            window.location.pathname === '/classes/'
        ) {
            classesPage()
        }
    }
}

function mergeClasses() {
    const e = document.querySelector('.class-merge')
    if (e.innerHTML != 'Close Menu') {
        if (window.innerWidth <= 1200) {
            document
                .querySelector('.hamburger-container')
                .classList.remove('change')
            document
                .querySelector('.navbar')
                .classList.remove('navbar-vertical')
        }
        document.querySelector('.merge-container').style.display = 'flex'
        e.innerHTML = 'Close Menu'
        document.querySelector('.main-body').classList.add('temp')
    } else {
        if (window.innerWidth <= 1200) {
            document
                .querySelector('.hamburger-container')
                .classList.add('change')
            document.querySelector('.navbar').classList.add('navbar-vertical')
        }
        document.querySelector('.merge-container').style.display = 'none'
        e.innerHTML = 'Merge Classes'
        document.querySelector('.main-body').classList.remove('temp')
    }
}

async function classesMerge() {
    document.getElementById('merge-btn').disabled = true
    const class1 = document.getElementById('class1').value
    const class2 = document.getElementById('class2').value
    if (class1 === '' || class2 === '') {
        document.getElementById('merge-btn').disabled = false
        token('You must choose two classes to combine.')
        return
    }

    if (
        classData[class1].tutor != localStorage.getItem('uid') ||
        classData[class2].tutor != localStorage.getItem('uid')
    ) {
        token('You must be a tutor in both classes to merge the classes!')
        document.getElementById('merge-btn').disabled = false
        return
    }

    if (class1 === class2) {
        token('The classes must be different.')
        document.getElementById('merge-btn').disabled = false
        return
    }

    if (!document.getElementById('merge-btn').classList.contains('selected')) {
        token(
            'If you want to merge these two classes please click the merge button again.'
        )
        document.getElementById('merge-btn').classList.add('selected')
        document.getElementById('merge-btn').disabled = false
        return
    }

    const students = classData[class2].students
    var linkedClasses = classData[class2].linkedClasses
    if (linkedClasses === undefined) {
        linkedClasses = []
    }
    linkedClasses.push(class2)

    var newStudents = []
    for (student of students) {
        const newStudent = {
            student: student.student,
            studentName: student.studentName,
            studentEmail: student.studentEmail,
        }
        newStudents.push(newStudent)
    }

    await db
        .collection('matches')
        .doc(class1)
        .update({
            students: firebase.firestore.FieldValue.arrayUnion(...newStudents),
            linkedClasses: firebase.firestore.FieldValue.arrayUnion(
                ...linkedClasses
            ),
        })

    await db.collection('matches').doc(class2).delete()
    token('These two classes have been merged')
}

window.onresize = function () {
    if (window.innerWidth > 1200) {
        document
            .querySelector('.hamburger-container')
            .classList.remove('change')
        document.querySelector('.navbar').classList.remove('navbar-vertical')
        const title = document.querySelector('.title')
        if (title) {
            title.classList.remove('invisible')
        }
        document.querySelector('.main-body').classList.remove('invisible')
    }
}
