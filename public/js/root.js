var navigation = document.getElementById('navigation')

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

firebase.auth().onAuthStateChanged((user) => {
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
    } else {
        if (window.location.pathname !== '/login') {
            if (window.location.pathname !== '/logout') {
                if (window.location.pathname === '/donate') {
                    alert(
                        'You are not signed in! Any donations made will not be attached to your Educationist account.'
                    )
                    return
                }
                if (window.location.pathname === '/reset') {
                    return
                }
                window.location.replace(
                    '/login?path=' + window.location.pathname
                )
                return
            }
            window.location.replace('/login')
        }
    }
})

function openMenu(value) {
    value.classList.toggle('change')
    document.querySelector('.navbar').classList.toggle('navbar-vertical')
    document.getElementsByClassName('title')[0].classList.toggle('invisible')
    document
        .getElementsByClassName('main-body')[0]
        .classList.toggle('invisible')
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
