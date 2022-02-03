const { degrees, PDFDocument, StandardFonts, rgb } = PDFLib
const params = new URLSearchParams(window.location.search)

async function createPdf() {
    const user = (
        await db.collection('users').doc(localStorage.getItem('uid')).get()
    ).data()
    const start = new Date(parseInt(params.get('start')))
    const end = new Date(parseInt(params.get('end')))
    const entries = user['volunteer-entries']
    var minutes = 0
    for (entry of entries) {
        const date = entry.date.toDate()
        if (date >= start && date <= end) {
            minutes += entry.minutes
        }
    }
    const url = 'https://cdn.educationisttutoring.org/images/certificate.pdf'
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()
    const name = user.name
    firstPage.drawText(name, {
        x: width / 2 - name.length * 10,
        y: height / 2 + 17,
        size: 40,
        font: font,
        color: rgb(0, 0, 0),
    })

    minutes = minutes.toFixed(0).toString()
    firstPage.drawText(minutes, {
        x: width / 2 - minutes.length * 7,
        y: height / 2 - 30,
        size: 20,
        font: font,
        color: rgb(0, 0, 0),
    })

    const month = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ]

    const range =
        month[start.getUTCMonth()] +
        ' ' +
        start.getUTCDate() +
        ', ' +
        start.getUTCFullYear() +
        ' and ' +
        month[end.getUTCMonth()] +
        ' ' +
        end.getUTCDate() +
        ', ' +
        end.getUTCFullYear()
    firstPage.drawText(range, {
        x: width / 2 - range.length * 5,
        y: height / 2 - 80,
        size: 20,
        font: font,
        color: rgb(0, 0, 0),
    })

    const date = new Date().toLocaleString('default', {
        month: 'long',
        year: 'numeric',
        day: '2-digit',
    })
    firstPage.drawText(date, {
        x: width / 2 - date.length * 5,
        y: height / 2 - 130,
        size: 20,
        font: font,
        color: rgb(0, 0, 0),
    })

    const pdfBytes = await pdfDoc.save()
    download(pdfBytes, 'Educationist Certificate.pdf', 'application/pdf')
    setTimeout(() => {
        window.close()
    }, 1000)
}

createPdf()
