var xhr = new XMLHttpRequest()
xhr.open('POST', '/stats', true)
xhr.send()
xhr.onload = async function () {
    const response = JSON.parse(this.response)
    animateValue(
        document.getElementById('tutor-count'),
        0,
        response.tutorCount,
        500
    )
    animateValue(
        document.getElementById('student-count'),
        0,
        response.studentCount,
        500
    )
    animateValue(
        document.getElementById('total-users'),
        0,
        response.totalCount,
        500
    )
    animateValue(document.getElementById('total-hours'), 0, response.hours, 500)
}

async function animateValue(obj, start, end, duration) {
    var startTimestamp
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp
        const progress = Math.min((timestamp - startTimestamp) / duration, 1)
        obj.innerHTML = Math.floor(progress * (end - start) + start)
        if (progress < 1) {
            window.requestAnimationFrame(step)
        }
    }
    window.requestAnimationFrame(step)
    return
}
