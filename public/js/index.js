dataSet = ['name', 'birthday', 'email']

async function getData() {
    const uid = localStorage.getItem('uid')
    const userData = await db.collection('users').doc(uid).get()
    const volunteerHours = await db
        .collection('users')
        .doc(uid)
        .collection('volunteer-entries')
        .get()

    if (volunteerHours.exists) {
        const data = []
        volunteerHours.forEach((doc) => {
            data.push({
                date: doc.data().date.toDate(),
                minutes: doc.data().minutes,
            })
        })

        data.sort((a, b) => {
            return a.date < b.date ? -1 : a.date == b.date ? 0 : 1
        })

        const hours = []
        const dates = []

        data.forEach((doc) => {
            dates.push(
                doc.date.toLocaleString('default', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                })
            )
            hours.push(Number((doc.minutes / 60).toFixed(1)))
        })
        placeData(userData.data(), [dates, hours])
    }
    placeData(userData.data(), false)
}

getData()

function placeData(data, dates) {
    var spacer = document.createElement('div')
    spacer.className = 'spacer'
    document.querySelector('.account').appendChild(spacer)
    data.birthday = data.birthday.toDate().toLocaleString('default', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
    dataFields = []
    for (dataField of dataSet) {
        createBlock(
            dataField.charAt(0).toUpperCase() + dataField.slice(1),
            [data[dataField]],
            'small'
        )
    }
    if (dates) {
        const volunteerHours = data['volunteer-hours']
        const minutes =
            volunteerHours['admin']['total'] +
            volunteerHours['tutor']['total'] +
            volunteerHours['content']['total']
        createBlock('Volunteer Hours', [minutes / 60 + ' Hours'], 'small')
        spacer = document.createElement('div')
        spacer.className = 'spacer'
        document.querySelector('.account').appendChild(spacer)
        createBlock(
            'Volunteer Hours',
            ['<canvas id="volunteerHours"></canvas>'],
            'large'
        )
        new Chart('volunteerHours', {
            type: 'line',
            data: {
                labels: dates[0],
                datasets: [
                    {
                        label: 'Volunteer Hours',
                        pointRadius: 5,
                        pointBackgroundColor: 'white',
                        data: dates[1],
                        borderWidth: 1,
                        backgroundColor: '#38b18a',
                    },
                ],
            },
            options: {
                legend: {
                    display: false,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                    xAxes: [
                        {
                            display: false,
                        },
                    ],
                },
                layout: {
                    padding: 20,
                },
            },
        })
    }
}

function createBlock(title, fields, size) {
    var block = document.createElement('div')
    block.className = 'block'
    block.classList.add(size)
    var titleBlock = document.createElement('h3')
    titleBlock.className = 'title-block'
    titleBlock.innerHTML = title
    block.append(titleBlock)
    for (field of fields) {
        var fieldBlock = document.createElement('p')
        fieldBlock.className = 'block-field'
        fieldBlock.innerHTML = field
        block.append(fieldBlock)
    }
    var object = ''
    if (size === 'small') {
        object = '.account'
    } else if (size === 'large') {
        object = '.big-blocks'
    }
    document.querySelector(object).appendChild(block)
}
