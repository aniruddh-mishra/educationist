var availabilities = {};

function showForm(elem) {
    document.getElementById("popup").classList.toggle("show");
    if (elem.innerHTML.includes("+")) {
        elem.innerHTML = "- New Availability"
    }
    else {
        elem.innerHTML = "+ New Availability"
    }
}

function addAvailability() {
    var table = document.getElementById('table');
    var tr = document.createElement("tr");
    tr.setAttribute("onclick", "removeAvailability(this);");
    tr.classList.add("availability");
    var day = document.getElementById("day").value;
    var hour1 = document.getElementById("start").value
    var format1 = document.getElementById("format1").value
    var hour2 = document.getElementById("end").value
    var format2 = document.getElementById("format2").value
    var startTime = hour1 + ":00 " + format1;
    var endTime = hour2 + ":00 " + format2;
    [hour1, hour2] = parseHours(hour1, hour2, format1, format2);
    if (hour1 === false) {
        return
    }
    for (let i = hour1; i < hour2; i++) {
        var current = availabilities[day]
        if (current) {
            if (current.includes(i)) {
                document.getElementById("error").innerHTML = "All or part of this timing exists!";
                return false;
            }
            current.push(i)
        }
        else {
            current = [i]
        }
        availabilities[day] = current
    } 
    var dayTh = document.createElement("th");
    var startTimeTh = document.createElement("th");
    var endTimeTh = document.createElement("th");
    dayTh.appendChild(document.createTextNode(day));
    startTimeTh.appendChild(document.createTextNode(startTime));
    endTimeTh.appendChild(document.createTextNode(endTime));
    tr.appendChild(dayTh);
    tr.appendChild(startTimeTh);
    tr.appendChild(endTimeTh);
    table.appendChild(tr);
}

function removeAvailability(element) {
    var row = element.childNodes;
    var day = row[0].textContent;
    var startTime = row[1].textContent;
    var endTime = row[2].textContent;
    var hour1 = startTime.slice(0, -6);
    var format1 = startTime.substr(-2);
    var hour2 = endTime.slice(0, -6);
    var format2 = endTime.substr(-2);
    [hour1, hour2] = parseHours(hour1, hour2, format1, format2);
    if (hour1 === false) {
        return false;
    }
    for (let i = hour1; i < hour2; i++) {
        var current = availabilities[day]
        current = current.filter(function(ele){ 
            return ele != i;
        });
        availabilities[day] = current
    } 
    element.remove();
}

function parseHours(hour1, hour2, format1, format2) {
    hour1 = parseInt(hour1)
    hour2 = parseInt(hour2)
    if (hour1 == 12) {
        hour1 -= 12;
    }
    if (hour2 == 12) {
        hour2 -= 12;
    }
    if (format1 == "PM") {
        hour1 += 12
    }
    if (format2 == "PM") {
        hour2 += 12
    }
    if (hour2 <= hour1) {
        document.getElementById("error").innerHTML = "End time must be after start!"
        return [false, false]
    }
    document.getElementById("error").innerHTML = " ‎"
    return [hour1, hour2]
}