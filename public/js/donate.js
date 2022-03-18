const master = [
    'Aniruddh Mishra',
    'Urjith Mishra',
    'Rajeev Mishra',
    'Uma Krishnan',
    'Aravindan Kasiraman',
]
const width = window.innerWidth
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

console.log(width, columns)
function fall(current) {
    currentCollumns = columns.map((x) => x)
    currentCollumns.splice(columns.indexOf(previousColumn), 1)
    if (current.length === 0) {
        setTimeout(() => {
            fall(master.map((x) => x))
        }, Math.floor(Math.random() * 500))
        return
    }
    const index = Math.floor(Math.random() * current.length)
    const randomElement = current[index]
    current.splice(index, 1)
    const element = document.createElement('p')
    element.innerHTML = randomElement
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
        fall(current.map((x) => x))
    }, Math.min(Math.floor(Math.random() * 500) + 500, 500))
}

fall(master.map((x) => x))
