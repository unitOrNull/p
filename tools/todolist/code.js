document.oncontextmenu = e => {
    e.preventDefault();
    e.stopPropagation();
    return false;
};

const FADE_OUT = [
    {
        opacity: '100%',
        transform: 'translateY(0px)',
    },
    {
        opacity: '0%',
        transform: 'translateY(50px)',
        display: 'none',
    }
]

class UserTask {
    constructor(title, description, daily, complete) {
        this.id = "task" + localID++;
        this.title = title; // String
        this.description = description; // String or Null
        this.daily = daily; // True or False 
        this.complete = complete; // False or timestamp completed

        this.createElement();        
    }

    createElement() {
        const container = document.createElement("div")
        container.classList.add("task")
        const titleElem = document.createElement("h2")
        titleElem.classList.add("noselect")
        if (this.daily) titleElem.classList.add("daily")
        titleElem.textContent = this.title;
        container.appendChild(titleElem);
        if (this.description !== null && this.description !== undefined && this.description !== "") {
            const desc = document.createElement('p')
            desc.classList.add("noselect")
            desc.textContent = this.description;
            container.appendChild(desc);
        }
        container.id = this.id;

        container.onmousedown = e => {
            e.preventDefault();
            e.stopPropagation();
            if (e.button === 0) { // LC
                if (this.complete === false) {
                    this.disable();
                } else {
                    this.enable();
                }
                updateDisplay();
                saveData();
            } else if (e.button === 2) { // RC
                beginEditTask(this);
            }

            return false;
        }

        container.oncontextmenu = e => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        document.getElementById('tasklist').appendChild(container)
        if (this.complete) this.disable();
    }

    disable() {
        this.complete = Date.now();
        document.getElementById(this.id).classList.add("complete")
    }

    enable() {
        this.complete = false;
        document.getElementById(this.id).classList.remove("complete")
    }
}








//////////////////// MAIN //////////////////// 

var fading = false;
var taskList = []
var localID = 0;
var lastUpdateTimestamp = 0;
var resetUTCTime = 0;

addEventListener('load', function() {
    loadData();
    document.getElementById('body').style.display='block';
    updateDailyTasks();
    updateDisplay();
    this.setInterval(updateDailyTasks, 1000);

    document.getElementById('settingUTCOffset').onchange = updateSettingDisplay
});







//////////////////// TASK CREATION //////////////////// 

function createNewTask() {
    document.getElementById('newtaskpopup').style.display='block';
}

function stopCreateNewTask() {
    if (fading) return;
    fading = true;
    const elem = document.getElementById('newtaskpopup');
    const anim = elem.animate(FADE_OUT, 300);
    anim.onfinish = _ => {
        elem.style.display='none';
        fading = false;

        // Clear text
        for (let e of document.getElementsByClassName('clearOnClose')) {
            e.value = "";
        }

        // Reset radio
        for (let e of document.getElementsByClassName('radio')) {
            e.checked = false;
        }
        for (let e of document.getElementsByClassName('defaultRadio')) {
            e.checked = true;
        }
    }
}

function attemptFinalizeTask() {
    if (fading) return;

    const inputOnce = document.getElementById('inputOnce')?.checked
    const inputDaily = document.getElementById('inputDaily')?.checked
    const inputTitle = document.getElementById('inputTitle')?.value
    const inputDescription = document.getElementById('inputDescription')?.value

    if (!inputTitle || inputTitle === "") {
        warning(document.getElementById('createTaskButton'));
        warning(document.getElementById('inputTitle'));    
        return;
    }
    
    const task = new UserTask(inputTitle, inputDescription, inputOnce === false, false);
    taskList.push(task);
    updateDisplay();
    saveData();

    fading = false;
    stopCreateNewTask();
}

function warning(elem) {
    elem.animate([
        {backgroundColor: '#F00'},
        {}
    ], 400);
}









//////////////////// DATA & DISPLAY //////////////////// 
function loadData() {
    const savedVersion = localStorage.getItem("version");
    lastUpdateTimestamp = localStorage.getItem("lasttimestampcheck")
    resetUTCTime = localStorage.getItem("utcOffset") || 0

    if (savedVersion !== null && savedVersion !== undefined) {
        // Not new
        let list = JSON.parse(localStorage.getItem("data"))
        taskList = list.map(x => new UserTask(x.title, x.description, x.daily, x.complete))
    }
}

function saveData() {
    localStorage.setItem("data", JSON.stringify(taskList))
    localStorage.setItem("version", 1)
    localStorage.setItem("lasttimestampcheck", lastUpdateTimestamp)
    localStorage.setItem("utcOffset", resetUTCTime)
}

function updateDisplay() {
    const taskListDiv = document.getElementById('tasklist');
    const emptyTaskListDiv = document.getElementById('emptytasklist')

    if (taskList.length === 0) {
        // Empty
        taskListDiv.style.display = 'none';
        emptyTaskListDiv.style.display = 'block';

    } else {
        // Not empty
        taskListDiv.style.display = 'block';
        emptyTaskListDiv.style.display = 'none';

        let currentY = document.getElementsByTagName('html')[0].getBoundingClientRect().bottom - 100;

        
        for (let task of taskList.filter(x => !x.complete)) {
            const elem = document.getElementById(task.id);
            elem.style.top = currentY + "px";
            const height = elem.getBoundingClientRect().bottom - elem.getBoundingClientRect().top;
            currentY += height + 10;
        }

        for (let task of taskList.filter(x => x.complete)) {
            const elem = document.getElementById(task.id);
            elem.style.top = currentY + "px";
            const height = elem.getBoundingClientRect().bottom - elem.getBoundingClientRect().top;
            currentY += height + 10;
        }
    }
}








//////////////////// EDITING TASKS //////////////////// 

var editingTask = undefined;

function beginEditTask(task) {
    editingTask = task;
    document.getElementById('editOnce').checked = !task.daily;
    document.getElementById('editDaily').checked = task.daily;
    document.getElementById('editTitle').value = task.title;
    document.getElementById('editDescription').value = task.description || ""
    document.getElementById('edittaskpopup').style.display='block';
}

function stopEditTask() {
    if (fading) return;
    fading = true;
    const elem = document.getElementById('edittaskpopup');
    const anim = elem.animate(FADE_OUT, 300);
    anim.onfinish = _ => {
        elem.style.display='none';
        fading = false;
    }
}

function attemptEditTask() {
    if (fading) return;

    const inputOnce = document.getElementById('editOnce')?.checked
    const inputDaily = document.getElementById('editDaily')?.checked
    const inputTitle = document.getElementById('editTitle')?.value
    const inputDescription = document.getElementById('editDescription')?.value

    if (!inputTitle || inputTitle === "") {
        warning(document.getElementById('createTaskButton'));
        warning(document.getElementById('editTitle'));    
        return;
    }
    
    editingTask.title = inputTitle;
    editingTask.description = inputDescription;
    editingTask.daily = inputOnce === false;

    document.getElementById(editingTask.id).remove();
    editingTask.createElement();
    updateDisplay();
    saveData();


    fading = false;
    stopEditTask();
}

function deleteTask() {
    if (fading) return;

    for (let i = 0; i < taskList.length; i++) {
        if (taskList[i].id === editingTask.id) {
            taskList.splice(i, 1);
            break;
        }
    }
    document.getElementById(editingTask.id).remove();
    updateDisplay();
    saveData();

    editingTask = undefined;
    fading = false;
    stopEditTask();
}






//////////////////// DAILY RESET //////////////////// 

function updateDailyTasks() {
    const offset = resetUTCTime*1000*60*60;
    if (timestampToDay(lastUpdateTimestamp + offset) !== timestampToDay(Date.now() + offset)) {
        for (let t of taskList) {
            if (t.complete && t.daily) {
                t.enable();
            }
        }
        lastUpdateTimestamp = Date.now();
        updateDisplay();
        saveData();
    }
}

function timestampToDay(x) {
    return Math.floor(x/1000/60/60/24);
}








//////////////////// SETTINGS //////////////////// 

function settingsMenu() {
    document.getElementById('settingUTCOffset').value = resetUTCTime;

    updateSettingDisplay();

    document.getElementById('settingsbox').style.display='block';
}

function closeSettings() {
    if (fading) return;
    fading = true;

    const elem = document.getElementById('settingsbox');
    const anim = elem.animate(FADE_OUT, 300);
    anim.onfinish = _ => {
        elem.style.display='none';
        fading = false;
    }
}

function updateSettings() {
    if (fading) return;
    resetUTCTime = document.getElementById('settingUTCOffset').value;

    saveData();

    fading = false;
    closeSettings();
}

function updateSettingDisplay() {
    const val = document.getElementById('settingUTCOffset').value;
    if (val == 0) {
        document.getElementById('timezonedisplay').innerHTML = "Time Zone (UTC)"
    } else if (val > 0 && val <= 12) {
        document.getElementById('timezonedisplay').innerHTML = "Time Zone (UTC+" + val + ")"
    } else if (val < 0 && val >= -12) {
        document.getElementById('timezonedisplay').innerHTML = "Time Zone (UTC" + val + ")"
    } else {
        document.getElementById('timezonedisplay').innerHTML = "Time Zone (err)"
    }
}