const tabList = ["first", "availabilities", "second", "login"]

const stepNum = {
    student: 4,
    volunteer: 4,
    parent: 3
}

function next() {
    tabNum = tab()
    if (tabNum === 0) {
        document.getElementById("prevBtn").classList.remove("tab")
        document.getElementById("welcome").classList.replace("welcome-message", "welcome-none")
    }
    if (tabNum === 2) {
        document.getElementById("nextBtn").classList.add("tab")
    }
    document.getElementById(tabList[tabNum + 1]).classList.toggle("display-tab")
    var status = document.getElementById("status").childNodes
    for (let i = 0; i < tabNum + 1; i++) {
        status[i].classList.add("status-complete")
    }
    
}

function prev() {
    tabNum = tab()
    if (tabNum === 1) {
        document.getElementById("prevBtn").classList.add("tab")
        document.getElementById("welcome").classList.replace("welcome-none", "welcome-message")
    }
    if (tabNum === 3) {
        document.getElementById("nextBtn").classList.remove("tab")
    }
    document.getElementById(tabList[tabNum - 1]).classList.toggle("display-tab")
}

function tab() {
    let currentTab = document.getElementsByClassName("display-tab")[0]
    currentTab.classList.toggle("display-tab")
    return tabList.findIndex((element) => element === currentTab.id)
}

function steps() {
    var status = document.getElementById("status")
    while (status.firstChild) {
        status.removeChild(status.firstChild);
    }
    let stepCount = stepNum[document.getElementById("role").value]
    console.log(stepCount)
    for (let i = 0; i < stepCount; i++) {
        var span = document.createElement("span")
        status.appendChild(span)
    }
}