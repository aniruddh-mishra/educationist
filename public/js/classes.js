const uid = localStorage.getItem('uid')
bufferToggle()
let classByKeys = {}

async function classesPage() {
    classData = classesData[0]
    inactiveClassData = classesData[1]
    if (
        Object.keys(classData).length === 0 &&
        Object.keys(inactiveClassData).length === 0
    ) {
        document.querySelector('.classes').innerHTML =
            'You are not currently registered in any classes.'
        bufferToggle()
        return
    }
    var counter = 1
    for (classIterator of classData) {
        var studentEmail = ''
        var studentName = ''
        const data = classIterator.data
        classByKeys[classIterator.id] = data
        for (student of data.students) {
            studentEmail += student.studentEmail + ', '
            studentName += student.studentName + ', '
        }

        studentEmail = studentEmail.trim().slice(0, -1)
        studentName = studentName.trim().slice(0, -1)

        var options = []
        options.push('Student: ' + studentName)
        options.push('Tutor: ' + data.tutorName)
        options.push('Student Email: ' + studentEmail)
        options.push('Tutor Email: ' + data.tutorEmail)
        options.push(
            'Subject: ' +
                data.subject.charAt(0).toUpperCase() +
                data.subject.slice(1)
        )

        let sections = []
        for (elem of options) {
            let p = document.createElement('p')
            p.innerHTML = elem
            sections.push(p)
        }

        const button = document.createElement('button')
        button.classList.add('btn-normal')
        button.innerHTML = 'Expand'
        button.onclick = function open() {
            expand(this)
        }
        sections.push(button)

        var nickName = 'Class #' + counter
        if (data.nickName) {
            nickName = data.nickName
        }

        counter += 1

        const card = createBlock(nickName, sections, 'small', classIterator.id)
        document.getElementById('cards').appendChild(card)

        const option = document.createElement('option')
        option.value = classIterator.id
        option.innerHTML = nickName
        document.getElementById('first-class').appendChild(option)
        document.getElementById('second-class').append(option.cloneNode(true))
    }

    counter = 1
    for (classIterator of inactiveClassData) {
        const data = classIterator.data

        var nickName = 'Inactive Class #' + counter
        if (data.nickName) {
            nickName = data.nickName
        }

        counter += 1

        var studentEmail = ''
        var studentName = ''

        for (student of data.students) {
            studentEmail += student.studentEmail + ', '
            studentName += student.studentName + ', '
        }

        studentEmail = studentEmail.trim().slice(0, -1)
        studentName = studentName.trim().slice(0, -1)

        var options = []
        options.push('Student: ' + studentName)
        options.push('Tutor: ' + data.tutorName)
        options.push('Student Email: ' + studentEmail)
        options.push('Tutor Email: ' + data.tutorEmail)
        options.push(
            'Subject: ' +
                data.subject.charAt(0).toUpperCase() +
                data.subject.slice(1)
        )

        let sections = []
        for (elem of options) {
            let p = document.createElement('p')
            p.innerHTML = elem
            sections.push(p)
        }

        const button = document.createElement('button')
        button.classList.add('btn-normal')
        button.innerHTML = 'Expand'
        button.onclick = function open() {
            expand(this)
        }
        sections.push(button)

        const card = createBlock(nickName, sections, 'small', classIterator.id)
        document.getElementById('cards').appendChild(card)
    }

    setHeights()
    document.getElementById('template').remove()
    bufferToggle()
}

function expand(e) {
    const docId = e.parentNode.id
    openLink('/class?id=' + docId)
}

function classesMergeStep1() {
    customAlert('Are you sure you want to merge these two classes?', () => {
        classesMerge()
    })
}

async function classesMerge() {
    bufferToggle()
    const class1 = document.getElementById('first-class').value
    const class2 = document.getElementById('second-class').value
    if (class1 === '' || class2 === '') {
        notify('You must choose two classes to combine.')
        return
    }

    const uid = localStorage.getItem('uid')

    if (classByKeys[class1].tutor != uid || classByKeys[class2].tutor != uid) {
        token('You must be a tutor in both classes to merge the classes!')
        return
    }

    if (class1 === class2) {
        token('The classes must be different.')
        return
    }

    const students = classByKeys[class2].students
    var linkedClasses = classByKeys[class2].linkedClasses
    if (linkedClasses === undefined) {
        linkedClasses = []
    }
    linkedClasses.push(class2)

    let newStudents = []
    let newStudentsNames = ''
    let newStudentsEmails = ''
    for (const student of students) {
        const newStudent = {
            student: student.student,
            studentName: student.studentName,
            studentEmail: student.studentEmail,
        }
        newStudents.push(newStudent)
        newStudentsNames += ', ' + student.studentName
        newStudentsEmails += ', ' + student.studentEmail
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

    notify('These two classes have been merged')
    document.getElementById(class2).remove()
    document.getElementById(class1).firstChild.nextSibling.innerHTML +=
        newStudentsNames
    document.getElementById(
        class1
    ).firstChild.nextSibling.nextSibling.nextSibling.innerHTML +=
        newStudentsEmails
    bufferToggle()
    setHeights()
}

function setHeights() {
    const blocks = document.querySelectorAll('.block')
    let change = 0
    for (block of blocks) {
        let height = 0
        block.childNodes.forEach((child) => {
            height += child.scrollHeight
        })
        if (height + 220 > change) {
            change = height + 220
        }
    }
    if (change) {
        for (block of blocks) {
            block.style.height = change + 'px'
        }
    }
}

this.addEventListener('classesReady', () => {
    classesPage()
})

window.onresize = () => {
    setHeights()
}
