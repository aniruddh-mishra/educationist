const uid = localStorage.getItem('uid')

async function classesPage() {
    if (
        Object.keys(classData).length === 0 &&
        Object.keys(inactiveClassData).length === 0
    ) {
        document.querySelector('.classes').innerHTML =
            'You are not currently registered in any classes.'
        return
    }
    var counter = 1
    var active = false
    document.querySelector('.classes').innerHTML = ''
    for (id of Object.keys(classData)) {
        var studentEmail = ''
        var studentName = ''
        const data = classData[id]

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

        var nickName = 'Class #' + counter
        if (data.nickName) {
            nickName = data.nickName
        }

        createBlock(nickName, options, 'small class', id)
        counter += 1
    }

    const maxActiveClasses = counter - 1

    counter = 1

    for (id of Object.keys(inactiveClassData)) {
        const data = inactiveClassData[id]

        var nickName = 'Inactive Class #' + counter
        if (data.nickName) {
            nickName = data.nickName
        }

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

        active = true
        const button =
            '<button onclick="expand(this.parentNode)" class="log">Expand</button>'
        options.push(button)

        createBlock(nickName, options, 'small class', id)
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

function expand(e) {
    const docId = e.parentNode.id
    window.location = '/class/' + docId
}

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
