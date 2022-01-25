var navigation = document.getElementById('navigation')

document.querySelector('body').classList.add('invisible')

if (navigation) {
    var header = document.createElement('header')
    header.innerHTML = `NAVIGATION`
    navigation.replaceWith(header)
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
        if (localStorage.getItem('uid') === null) {
            logout()
        }
        if (window.location.pathname === '/login') {
            const params = new URLSearchParams(window.location.search)
            if (params.has('path')) {
                window.location.replace(params.get('path'))
                return
            }
            window.location.replace('/')
        }

        var role = localStorage.getItem('role')
        if (role == undefined) {
            role = (await db.collection('users').doc(user.uid).get()).data()
                .role
            localStorage.setItem('role', role)
        }

        if (role != 'admin') {
            document.getElementById('admin-link').remove()
        }
        if (window.location.pathname === '/admin' && role != 'admin') {
            logout()
        }
        document.querySelector('body').classList.remove('invisible')
    } else {
        document.querySelector('.dropdown').remove()
        const r = document.querySelector(':root')
        r.style.setProperty('--navbar-width', '23em')
        document.querySelector('body').classList.remove('invisible')
        if (window.location.pathname !== '/login') {
            if (
                window.location.pathname === '/reset' ||
                window.location.pathname === '/register' ||
                window.location.pathname === '/create'
            ) {
                return
            }
            window.location.replace('/login?path=' + window.location.pathname)
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
    firebase.auth().signOut()
}

function dropdown() {
    if (
        window.location.pathname == '/login' ||
        window.location.pathname == '/reset'
    ) {
        return
    }
    document.getElementById('myDropdown').classList.toggle('show')
}

window.onclick = function (event) {
    if (!event.target.matches('.navbarBtn')) {
        var dropdowns = document.getElementsByClassName('dropdown-content')
        var i
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i]
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show')
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
