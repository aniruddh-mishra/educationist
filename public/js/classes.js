var classData = {}
const uid = localStorage.getItem('uid')

async function classes() {
    const userData = await db.collection('users').doc(uid).get()
    localStorage.setItem('timezone', userData.data().timezone)
    localStorage.setItem('role', userData.data().role)
    localStorage.setItem('name', userData.data().name)
    localStorage.setItem('email', userData.data().email)
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/classes', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            uid: uid,
            name: userData.data().name,
            email: userData.data().email,
            student: userData.data().role === 'student' ? 'true' : 'false',
        })
    )
    xhr.onload = function () {
        localStorage.removeItem('name')
        localStorage.removeItem('email')
        const data = JSON.parse(this.response)
        if (data.length === 0) {
            document.querySelector('.class-merge').remove()
            document.querySelector('.classes').innerHTML =
                'You are not currently registered in any classes.'
            return
        }
        if (localStorage.getItem('role') === 'student') {
            document.querySelector('.class-merge').remove()
        }
        var counter = 1
        var active = false
        var inactiveClasses = []
        document.querySelector('.classes').innerHTML = ''
        for (classItem of data) {
            var studentEmail = ''
            var studentName = ''
            const data = classItem.data
            classData[classItem.id] = classItem.data

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

            active = true
            const button =
                '<button onclick="expand(this.parentNode)" class="log">Expand</button>'
            options.push(button)

            if (data.inactive) {
                inactiveClasses.push([options, classItem.id])
                continue
            }

            createBlock(
                'Class #' + counter,
                options,
                'small class',
                classItem.id
            )
            counter += 1
        }

        const maxActiveClasses = counter - 1

        counter = 1
        for (classItem of inactiveClasses) {
            createBlock(
                'Inactive Class #' + counter,
                classItem[0],
                'small class',
                classItem[1]
            )
            counter += 1
        }

        if (!active) {
            const blocks = document.querySelectorAll('.class')
            for (block of blocks) {
                block.style.height = '300px'
            }
        } else {
            const blocks = document.querySelectorAll('.class')
            var change = false
            for (block of blocks) {
                var height = 0
                block.childNodes.forEach((child) => {
                    height += child.offsetHeight
                })
                if (height > 350) {
                    change = height + 220 + 'px'
                    break
                }
            }
            if (change != false) {
                for (block of blocks) {
                    block.style.height = change
                }
            }
        }

        spacer = document.createElement('div')
        spacer.className = 'spacer'
        document.querySelector('.classes').appendChild(spacer)

        if (localStorage.getItem('role') != 'student') {
            for (let i = 1; i <= maxActiveClasses; i++) {
                const option = document.createElement('option')
                option.value = i
                option.innerHTML = 'Class #' + i
                document.getElementById('class1').appendChild(option)
                const option2 = document.createElement('option')
                option2.value = i
                option2.innerHTML = 'Class #' + i
                document.getElementById('class2').appendChild(option2)
            }
            document.querySelector('.class-merge').setAttribute('style', '')
        }
    }
}

async function mergeClasses() {
    document.getElementById('merge-btn').disabled = true
    const class1 = document.getElementById('class1').value.trim()
    const class2 = document.getElementById('class2').value.trim()
    if (class1 === '' || class2 === '') {
        document.getElementById('merge-btn').disabled = false
        token('You must choose two classes to combine.')
        return
    }
    var classID1 = ''
    var classID2 = ''
    document.querySelectorAll('.class').forEach((classItem) => {
        if (classItem.firstChild.innerText === 'Class #' + class1) {
            classID1 = classItem.id
        } else if (classItem.firstChild.innerText === 'Class #' + class2) {
            classID2 = classItem.id
        }
    })

    if (
        classData[classID1].tutor != localStorage.getItem('uid') ||
        classData[classID2].tutor != localStorage.getItem('uid')
    ) {
        token('You must be a tutor in both classes to merge the classes!')
        document.getElementById('merge-btn').disabled = false
        return
    }

    if (classID1 === '' || classID2 === '') {
        token('The class IDs must be valid numbers of your classes')
        document.getElementById('merge-btn').disabled = false
        return
    }

    if (classID1 === classID2) {
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

    const students = classData[classID2].students
    var linkedClasses = classData[classID2].linkedClasses
    if (linkedClasses === undefined) {
        linkedClasses = []
    }
    linkedClasses.push(classID2)

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
        .doc(classID1)
        .update({
            students: firebase.firestore.FieldValue.arrayUnion(...newStudents),
            linkedClasses: firebase.firestore.FieldValue.arrayUnion(
                ...linkedClasses
            ),
        })

    await db.collection('matches').doc(classID2).delete()
    token('These two classes have been merged')
}

function expand(e) {
    const docId = e.parentNode.id
    window.location = '/class/' + docId
}

classes()

function createBlock(title, fields, size, blockId) {
    var block = document.createElement('div')
    block.className = 'block ' + size
    block.id = blockId
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
    } else if (size === 'small request') {
        object = '.matches'
    } else if (size.includes('small class')) {
        object = '.classes'
    }
    document.querySelector(object).appendChild(block)
}
