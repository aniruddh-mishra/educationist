var userData
let orderId
var anonymousValue = false
var honorPage = false

if (!localStorage.getItem('uid')) {
    document.getElementById('default').remove()
    document.getElementById('label-default').remove()
}

if (
    window.location.pathname === '/donate' ||
    window.location.pathname === '/donate/'
) {
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/paypal/init', true)
    xhr.send('Receive access token')
    xhr.onload = function () {
        setUp(this.response)
    }
    document.getElementById('donate-form').addEventListener('submit', (e) => {
        e.preventDefault()
    })
} else {
    honorPage = true
    document.getElementById('donate-container').remove()
}

async function setUp(clientID) {
    if (localStorage.getItem('uid')) {
        const snapshot = await db
            .collection('users')
            .doc(localStorage.getItem('uid'))
            .get()
        userData = snapshot.data()
    }
    const url =
        'https://www.paypal.com/sdk/js?components=buttons&disable-funding=credit,card&currency=USD&client-id=' +
        clientID
    const scriptTag = document.getElementById('paypal-script')
    scriptTag.setAttribute('src', url)
    scriptTag.onload = paypalSetUp
}

async function paypalSetUp() {
    paypal
        .Buttons({
            // Sets up the transaction when a payment button is clicked
            createOrder: function (data, actions) {
                if (!donationAmount()) {
                    token('Your donation must be a number between 1 and 10000.')
                    return
                }

                const isEmail = document
                    .getElementById('email')
                    .value.match(
                        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    )

                if (
                    !(
                        isEmail &&
                        (document.getElementById('name').value != '' ||
                            anonymousValue)
                    )
                ) {
                    token('You must fill out the information fields')
                    return
                }

                if (!localStorage.getItem('uid')) {
                    var uid = null
                } else {
                    uid = localStorage.getItem('uid')
                }

                return fetch('/paypal/orders', {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: document.getElementById('donation-amount')
                            .value,
                        uid: uid,
                    }),
                })
                    .then((response) => response.json())
                    .then((order) => order.id)
            },

            // Finalize the transaction after payer approval
            onApprove: function (data, actions) {
                if (anonymousValue) {
                    var name = 'Anonymous'
                } else {
                    var name = document.getElementById('name').value
                }

                return fetch(`/paypal/orders/${data.orderID}/capture`, {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        email: document.getElementById('email').value,
                    }),
                }).then((response) => {
                    window.location.replace('/donate/success')
                })
            },

            onCancel: function (data, action) {
                return fetch(`/paypal/orders/${data.orderID}/cancel`, {
                    method: 'post',
                })
            },
        })
        .render('#paypal-button-container')
}

async function setUpFalling() {
    const snapshot = await db
        .collection('donations')
        .where('verified', '==', true)
        .where('name', '!=', 'Anonymous')
        .get()
    var master = []
    snapshot.forEach((doc) => {
        const data = doc.data()
        master.push({
            name: data.name,
            amount: parseInt(data.amount),
        })
    })
    fall(
        master.map((x) => x),
        master
    )
}

var width = window.innerWidth
var fallingSetUp = false

if (width <= 700 && honorPage) {
    document.getElementById('falling').innerHTML =
        'Please view this page on mobile'
} else if (width >= 700) {
    setUpFalling()
    fallingSetUp = true
}

var previousColumn

var columnNumber = Math.floor(width / 250)
var columns = []
for (let i = 0; i <= columnNumber; i++) {
    if (((width - 125) / columnNumber) * i + 150 > width) {
        continue
    }
    columns.push(((width - 125) / columnNumber) * i)
}
columnNumber = columns.length

function fall(current, master) {
    currentCollumns = columns.map((x) => x)
    currentCollumns.splice(columns.indexOf(previousColumn), 1)
    if (current.length === 0) {
        setTimeout(() => {
            fall(
                master.map((x) => x),
                master
            )
        }, Math.floor(Math.random() * 500))
        return
    }
    const index = Math.floor(Math.random() * current.length)
    const randomElement = current[index]
    current.splice(index, 1)
    const element = document.createElement('p')
    element.innerHTML = randomElement.name
    if (randomElement.amount >= 20) {
        element.classList.add('special2')
    } else if (randomElement.amount >= 5) {
        element.classList.add('special1')
    }
    const startColumn =
        currentCollumns[Math.floor(Math.random() * currentCollumns.length)]
    const endColumn = Math.min(
        startColumn + Math.floor(Math.random() * 250) - 125,
        width - 110
    )
    previousColumn = startColumn
    element.style.setProperty('--start', startColumn + 'px')
    element.style.setProperty('--end', endColumn + 'px')
    element.classList.add('fall')
    document.getElementById('falling').appendChild(element)
    setTimeout(
        () => {
            element.remove()
        },
        9000,
        element
    )
    setTimeout(() => {
        fall(
            current.map((x) => x),
            master
        )
    }, Math.min(Math.floor(Math.random() * 500) + 500, 500))
}

window.onresize = () => {
    width = window.innerWidth
    document.getElementById('falling').classList.remove('temp')
    if (width <= 700) {
        if (honorPage) {
            document.getElementById('falling').innerHTML =
                'Please view this page on mobile'
        } else {
            document.getElementById('falling').classList.add('temp')
        }
        return
    } else if (!fallingSetUp) {
        setUpFalling()
        fallingSetUp = true
    }

    columnNumber = Math.floor(width / 250)
    columns = []
    for (let i = 0; i <= columnNumber; i++) {
        if (((width - 125) / columnNumber) * i + 150 > width) {
            continue
        }
        columns.push(((width - 125) / columnNumber) * i)
    }
    columnNumber = columns.length
    document.getElementById('falling').innerHTML = ''
}

function defaultInformation() {
    if (
        document
            .getElementById('information-section')
            .classList.contains('temp')
    ) {
        document.getElementById('information-section').classList.remove('temp')
        document.getElementById('name').value = ''
        document.getElementById('email').value = ''
    } else {
        document.getElementById('information-section').classList.add('temp')
        document.getElementById('name').value = userData.name
        document.getElementById('email').value = userData.email
    }
}

function anonymous() {
    document.getElementById('name').classList.toggle('temp')
    document.getElementById('name-header').classList.toggle('temp')
    anonymousValue = !anonymousValue
}

function donationAmount(amount, e) {
    if (!amount) {
        return (
            !isNaN(document.getElementById('donation-amount').value) &&
            document.getElementById('donation-amount').value >= 1 &&
            document.getElementById('donation-amount').value <= 10000
        )
    }
    document.getElementById('donation-amount').classList.remove('temp')
    if (amount != -1) {
        document.getElementById('donation-amount').value = amount
        document.getElementById('donation-amount').classList.add('temp')
    } else {
        document.getElementById('donation-amount').value = ''
        document.getElementById('donation-amount').classList.remove('temp')
    }
    if (document.querySelector('.selected-option')) {
        document.querySelector('.selected-option').classList = 'option'
    }
    e.classList = 'selected-option'
}
