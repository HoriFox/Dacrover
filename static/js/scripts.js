// GLOBAL VALUE
timeAgo = 0;
var sensorsDict = {}; // ip:module-id
// GLOBAL VALUE

function GetXmlHttp() {
    var xmlhttp;
    try {
        xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
        try {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (E) {
            xmlhttp = false;
        }
    }
    if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
        xmlhttp = new XMLHttpRequest();
    }
    return xmlhttp;
}

function SendRequest(_req, _atr, _async = true, _head = true) {
    _req.open('POST', '/data', _async);
    if (_head) _req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    _req.send(_atr);
}

function notif (message, title = '', styleNotif = 'success')
{
    window.createNotification({
        // success, info, warning, error, and none
        // theme: 'success' // default
        theme: styleNotif
    })({
        title: title,
        message: message
    });
}

// 1. CREATE Module
function AddCreateBlockModule(block) {
    editForm = document.querySelector('#input-form-module-template').cloneNode(true);
    editForm.id = 'input-form-module';
    editForm.querySelector('#confirm').onclick = function() { ConfirmEditModule(this); };
    editForm.querySelector('#cancel').onclick = function() { CloseEditBlock(this); };
    document.querySelector('#' + block).append(editForm);
}

// 1. CREATE Plan
function AddCreateBlockPlan(block) {
    editForm = document.querySelector('#input-form-plan-template').cloneNode(true);
    editForm.id = 'input-form-plan';
    editForm.querySelector('#confirm').onclick = function() { ConfirmEditPlan(this); };
    editForm.querySelector('#cancel').onclick = function() { CloseEditBlock(this); };
    document.querySelector('#' + block).append(editForm);
}

// 1. CREATE Reminder
function AddCreateBlockReminder(block) {
    editForm = document.querySelector('#input-form-reminder-template').cloneNode(true);
    editForm.id = 'input-form-reminder';
    editForm.querySelector('#confirm').onclick = function() { ConfirmEditReminder(this); };
    editForm.querySelector('#cancel').onclick = function() { CloseEditBlock(this); };
    document.querySelector('#' + block).append(editForm);
}

// 2. EDIT Module
function EditModule(element) {
    container = element.parentNode.parentNode;
    container.style.display = 'none';

    editForm = document.querySelector('#input-form-module-template').cloneNode(true);
    editForm.id = 'input-form-module';
    editForm.querySelector('#edit-name').value = container.querySelector('#name').innerHTML;
    editForm.querySelector('#edit-user').value = container.querySelector('#user').innerHTML;
    editForm.querySelector('#edit-id').value = container.querySelector('#id').innerHTML;
    editForm.querySelector('#edit-ip').value = container.querySelector('#ip').innerHTML;
    editForm.querySelector('#edit-type').value = container.querySelector('#type').innerHTML;
    editForm.querySelector('#edit-left').value = container.querySelector('#left').innerHTML;
    editForm.querySelector('#edit-top').value = container.querySelector('#top').innerHTML;
    editForm.querySelector('#edit-color').value = container.querySelector('#color').innerHTML;
    
    container.after(editForm);
}

// 2. EDIT Plan
function EditPlan(element) {
    container = element.parentNode.parentNode;
    container.style.display = 'none';
    
    editForm = document.querySelector('#input-form-plan-template').cloneNode(true);
    editForm.id = 'input-form-plan';
    editForm.querySelector('#edit-id').value = container.querySelector('#id').innerHTML;
    editForm.querySelector('#edit-ip').value = container.querySelector('#ip').innerHTML;

    var elementsDay = container.querySelector('#days').innerHTML.split(' ');
    for (var i = 0; i < elementsDay.length; i++) {
        editForm.querySelector('#' + elementsDay[i]).checked = true;
    }

    editForm.querySelector('#edit-time-start').value = container.querySelector('#time-start').innerHTML;
    editForm.querySelector('#edit-time-end').value = container.querySelector('#time-end').innerHTML;
    editForm.querySelector('#edit-text-disc').value = container.querySelector('#text-disc').innerHTML;
    
    container.after(editForm);
}

// 2. EDIT Reminder
function EditReminder(element) {
    container = element.parentNode.parentNode;
    container.style.display = 'none';
    
    editForm = document.querySelector('#input-form-reminder-template').cloneNode(true);
    editForm.id = 'input-form-reminder';
    editForm.querySelector('#edit-id').value = container.querySelector('#id').innerHTML;
    editForm.querySelector('#edit-user').value = container.querySelector('#user').innerHTML;
    editForm.querySelector('#edit-disc').value = container.querySelector('#disc').innerHTML;
    editForm.querySelector('#edit-reminder-list').innerHTML = container.querySelector('#reminder-list').innerHTML.split('<br>').join('\n');
    
    container.after(editForm);
}

// 3. CONFIRM EDIT Module
function ConfirmEditModule(buttonConfirm, type = 'create') {
    editForm = buttonConfirm.parentNode.parentNode;
    
    var editId = editForm.querySelector('#edit-id').value;
    var idModule = editId == '' ? 'NULL' : editId;

    // Получение данных, отправка на сервер изменений, если успешно, продолжить
    setData = {}
    setData['function'] = 'set_module';
    setData['name'] = editForm.querySelector('#edit-name').value;
    setData['user'] = editForm.querySelector('#edit-user').value;
    setData['id'] = idModule;
    setData['ip'] = editForm.querySelector('#edit-ip').value;
    setData['type'] = editForm.querySelector('#edit-type').value;

    var left = editForm.querySelector('#edit-left').value;
    var top = editForm.querySelector('#edit-top').value;
    var color = editForm.querySelector('#edit-color').value;
    setData['mapdata'] = left + '|' + top + '|' + color;

    var req = GetXmlHttp();
    req.onreadystatechange = function() {  
        if (req.readyState == 4) { 
            if(req.status == 200) {
                CloseEditBlock(buttonConfirm, type);
                // TODO Если несколько открытых панелей, то всё перезагружается
                Refresh(); 
            }
            else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
        }
    }
    var json_string = JSON.stringify(setData);
    SendRequest(req, json_string);
}

// 3. CONFIRM EDIT Plan
function ConfirmEditPlan(buttonConfirm, type = 'create') {
    editForm = buttonConfirm.parentNode.parentNode;

    setData = {}
    setData['function'] = 'set_plan';
    setData['disc'] = editForm.querySelector('#edit-text-disc').value;

    var editId = editForm.querySelector('#edit-id').value;
    var idPlan = editId == '' ? 'NULL' : editId;
    setData['id'] = idPlan;

    setData['ip'] = editForm.querySelector('#edit-ip').value;

    var allDaysElement = editForm.querySelectorAll('.cbox-day');
    var daysList = [];
    for (var i = 0; i < allDaysElement.length; i++) {
        if (allDaysElement[i].checked == true) daysList.push(allDaysElement[i].id)
    }
    setData['days'] = daysList.join(' ');

    var timeList = [];
    timeList.push(editForm.querySelector('#edit-time-start').value)
    timeList.push(editForm.querySelector('#edit-time-end').value)
    setData['time'] = timeList.join(' ');

    var req = GetXmlHttp();
    req.onreadystatechange = function() {  
        if (req.readyState == 4) { 
            if(req.status == 200) {
                CloseEditBlock(buttonConfirm, type);
                // TODO Если несколько открытых панелей, то всё перезагружается
                Refresh(); 
            }
            else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
        }
    }
    var json_string = JSON.stringify(setData);
    SendRequest(req, json_string);
}

// 3. CONFIRM EDIT Reminder
function ConfirmEditReminder(buttonConfirm, type = 'create') {
    editForm = buttonConfirm.parentNode.parentNode;
    
    var editId = editForm.querySelector('#edit-id').value;
    var idModule = editId == '' ? 'NULL' : editId;

    // Получение данных, отправка на сервер изменений, если успешно, продолжить
    setData = {}
    setData['function'] = 'set_reminder';
    setData['id'] = idModule;
    setData['user'] = editForm.querySelector('#edit-user').value;
    setData['disc'] = editForm.querySelector('#edit-disc').value;
    setData['list'] = editForm.querySelector('#edit-reminder-list').value.split('\n').join('[DEL]');

    var req = GetXmlHttp();
    req.onreadystatechange = function() {  
        if (req.readyState == 4) { 
            if(req.status == 200) {
                CloseEditBlock(buttonConfirm, type);
                // TODO Если несколько открытых панелей, то всё перезагружается
                Refresh(); 
            }
            else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
        }
    }
    var json_string = JSON.stringify(setData);
    SendRequest(req, json_string);
}

// 4. DELETE Module
function DeleteModule(buttonDelete) {
    editForm = buttonDelete.parentNode.parentNode;
    var editId = editForm.querySelector('#edit-id').value;
    if (editId != '') {
    	deleteData = {}
    	deleteData['function'] = 'delete_module';
    	deleteData['id'] = editId;

    	var req = GetXmlHttp();
	    req.onreadystatechange = function() {  
	        if (req.readyState == 4) { 
	            if(req.status == 200) { 
                    // TODO Если несколько открытых панелей, то всё перезагружается
                    Refresh(); 
                }
	            else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
	        }
	    }
	    var json_string = JSON.stringify(deleteData);
        SendRequest(req, json_string);
    } else {
        notif('Попытка удалить блок редактирования', 'Ошибка', 'warning');
    }
}

// 4. DELETE Plan
function DeletePlan(buttonDelete) {
    editForm = buttonDelete.parentNode.parentNode;
    var editId = editForm.querySelector('#edit-id').value;
    if (editId != '') {
        deleteData = {}
        deleteData['function'] = 'delete_plan';
        deleteData['id'] = editId;

        var req = GetXmlHttp();
        req.onreadystatechange = function() {  
            if (req.readyState == 4) { 
                if(req.status == 200) { 
                    // TODO Если несколько открытых панелей, то всё перезагружается
                    Refresh(); 
                }
                else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
            }
        }
        var json_string = JSON.stringify(deleteData);
        SendRequest(req, json_string);
    } else {
        notif('Попытка удалить блок редактирования', 'Ошибка', 'warning');
    }
}

// 4. DELETE Reminder
function DeleteReminder(buttonDelete) {
    editForm = buttonDelete.parentNode.parentNode;
    var editId = editForm.querySelector('#edit-id').value;
    if (editId != '') {
        deleteData = {}
        deleteData['function'] = 'delete_reminder';
        deleteData['id'] = editId;

        var req = GetXmlHttp();
        req.onreadystatechange = function() {  
            if (req.readyState == 4) { 
                if(req.status == 200) { 
                    // TODO Если несколько открытых панелей, то всё перезагружается
                    Refresh();
                }
                else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
            }
        }
        var json_string = JSON.stringify(deleteData);
        SendRequest(req, json_string);
    } else {
        notif('Попытка удалить блок редактирования', 'Ошибка', 'warning');
    }
}

// 5. CLOSE EDIT Module
function CloseEditBlock(buttonCancel, type = 'edit') {
    editForm = buttonCancel.parentNode.parentNode;
    if (type == 'edit') editForm.previousElementSibling.style.display = 'inline-block';
    editForm.remove();
}

// Кнопка обновления
function Refresh() {
	GetDataModuleAndMap();
    GetDataPlan();
    GetDataReminder();
    UpdageSensorData();
    timeAgo = 0;
    document.querySelector('#status-refresh').innerHTML = 'Последнее обновление - 0 секунд назад';
}

// Функция в таймере 5 секунд
function UpdageTimeAgo() {
    timeAgo += 5;
    document.querySelector('#status-refresh').innerHTML = 'Последнее обновление - ' + timeAgo + ' секунд назад';
}

// Функция в таймере 3 минуты
function UpdageSensorData() {
    for(var sensorIp in sensorsDict) {
        var sensorModuleId = sensorsDict[sensorIp];
        SendRequestSensor(sensorIp, sensorModuleId);
    }
}

function AddModuleValidate(container) {
    var nextAction = true;

    editName = container.querySelector("#edit-name");
    editName.classList.add('error');
    ResetError(editName);
    if (!editName.value) {
        nextAction = false;
        ShowError(editName);
    }
    editIp = container.querySelector("#edit-ip");
    ResetError(editIp);
    if (!editIp.value) {
        nextAction = false;
        ShowError(editIp);
    }

    return nextAction;
}

function ShowError(container) {
    container.classList.remove('success'); 
    container.classList.add('error'); 
}

function ResetError(container) {
    container.classList.remove('error'); 
    container.classList.add('success'); 
}

// Исполнитель ЗАПРОС К РЕЛЕ
function SendRequestRelay(ip, value) {
    jProgress.start();
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/', true);
    xhr.onreadystatechange = function() {  
        if (xhr.readyState == 4) { 
            if(xhr.status == 200) {
                jProgress.stop();
            	if (xhr.responseText == 'error-connection-ip') {
            		notif('Нет подключения к указанному ip', 'Ошибка', 'warning');
            	}
        	}
        }
    }
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({"type":"relay", "ip":ip, "value":value}));
}

// Исполнитель ЗАПРОС К ДАТЧИКУ
function SendRequestSensor(ip, id_module_block) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/', true);
    xhr.onreadystatechange = function() {  
        if (xhr.readyState == 4) { 
            if(xhr.status == 200) {
                var data = undefined;
            	if (xhr.responseText != 'error-connection-ip') {
                    try {
                        data = JSON.parse(xhr.responseText)[0];
                    } catch (e) {
                        data = 'error-syntax'
                    }
            	}
                var sensor_data = document.querySelector('#' + id_module_block).querySelector('#sensor-data');
                UpdateSensorData(data, sensor_data);
        	}
        }
    }
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({"type":"sensor", "ip":ip.toString()}));
}

function UpdateSensorData(data, sensor_data) {
    htmlCode = '';
    if (data != undefined) {
        if (data == 'error-syntax') {
            htmlCode += `Ошибка сопряжения`;
        } else {
            if (data.temperature != undefined) {
                htmlCode += `Температура: ` + data.temperature + '°C<br>'
            }
            if (data.humidity != undefined) {
                htmlCode += `Влажность: ` + data.humidity + '%<br>'
            }
            if (data.pir_artive != undefined) {
                htmlCode += `Движение: ` + data.pir_artive + '<br>'
            }
        }
    } else {
        htmlCode += `Сенсор не отвечает`;
    }
    sensor_data.innerHTML = htmlCode;
}

// 1. GET DATA ModuleAndMap
function GetDataModuleAndMap() {
    var req = GetXmlHttp();
    req.onreadystatechange = function() {  
        if (req.readyState == 4) { 
            if(req.status == 200) {
                var json = JSON.parse(req.responseText);
                SetDataModuleAndMap(json);
            }
            else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
        }
    }
    var json_string = JSON.stringify({'function':'get_list_module'});
    SendRequest(req, json_string);
}

// 1. GET DATA Plan
function GetDataPlan() {
    var req = GetXmlHttp();
    req.onreadystatechange = function() {  
        if (req.readyState == 4) { 
            if(req.status == 200) {
                var json = JSON.parse(req.responseText);
                SetDataPlan(json);
            }
            else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
        }
    }
    var json_string = JSON.stringify({'function':'get_list_plan'});
    SendRequest(req, json_string);
}

// 1. GET DATA Reminder
function GetDataReminder() {
    var req = GetXmlHttp();
    req.onreadystatechange = function() {  
        if (req.readyState == 4) { 
            if(req.status == 200) {
                var json = JSON.parse(req.responseText);
                SetDataReminder(json);
            }
            else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
        }
    }
    var json_string = JSON.stringify({'function':'get_list_reminder'});
    SendRequest(req, json_string);
}

// 2. SET DATA ModuleAndMap
function SetDataModuleAndMap(json) {
    var container_map = document.querySelector('#container-map');
	var container_relay = document.querySelector('#container-module-reley');
	var container_sensor = document.querySelector('#container-module-sensor');
    htmlCodeMap = '';
	htmlCodeRelay = '';
	htmlCodeSensor = '';
    sensorsDict = {};
	for (var i = 0; i < json.length; i++) {
		var type = '';
		var imgModule = '';
		if (json[i].ModuleType == 'Реле-свет') imgModule = '/static/img/switch.png';
		if (json[i].ModuleType == 'Реле-розетка') imgModule = '/static/img/socket.png';
        if (json[i].ModuleType == 'Сенсор') imgModule = '/static/img/temp.png';

		var contentModule = ''
		if (json[i].ModuleType == 'Реле-свет' || json[i].ModuleType == 'Реле-розетка') {
			contentModule = `<div class="ibutton ibutton-on" style="margin-top: 5px;" onclick="SendRequestRelay('${json[i].ModuleIp}', '1')">Включить</div>
		                    <div class="ibutton ibutton-off" style="margin-top: 5px;" onclick="SendRequestRelay('${json[i].ModuleIp}', '0')">Выключить</div>`;
		    type = 'relay';
		}
		if (json[i].ModuleType == 'Сенсор') {
            sensorsDict[json[i].ModuleIp] = 'module-' + json[i].ModuleId;
			contentModule = `<div class="ibutton ibutton-on" style="margin-top: 5px;" onclick="SendRequestSensor('${json[i].ModuleIp}', 'module-${json[i].ModuleId}')">Обновить</div>
                            <div id="sensor-data" style="font-size: 20px; padding-top: 8px; color: #e0641c;">Не обновлено</div>`;
			type = 'sensor';
		}

        var mapData = json[i].MapData.split('|');

		var moduleCode = `<div class="item-module panel" id="module-${json[i].ModuleId}">
                            <div id="ip">${json[i].ModuleIp}</div>
                            <div id="type">${json[i].ModuleType}</div>
    		                <img class="item-image" src="${imgModule}" style="padding: 35px 0 10px 10px;">
    		                <div style="display: inline-block; padding: 35px 0 10px 10px;">
    		                    <div id="name">${json[i].ModuleName}</div>
    		                    <div id="user" style="color: #50b925;">${json[i].ModuleUser}</div>
    		                    <div id="id" style="display: none;">${json[i].ModuleId}</div>
                                <div id="left" style="display: none;">${mapData[0]}</div>
                                <div id="top" style="display: none;">${mapData[1]}</div>
                                <div id="color" style="display: none;">${mapData[2]}</div>
    		                    ${contentModule}
    		                </div>
    		                <div style="display: inline-block; vertical-align: top;padding: 35px 10px 10px 10px;">
    		                    <img class="button-image" src="/static/img/edit.png" onclick="EditModule(this)">
    		                </div>
    		            </div>`;

        htmlCodeMap += `<div class="marker" onmousedown="mouseDown(this)" id="marker-${json[i].ModuleId}" style="left: ${mapData[0]}px; top: ${mapData[1]}px; background-color:${mapData[2]};">
                        <div class="marker-desc">${json[i].ModuleName} ${contentModule}</div>
                    </div>`

		if (type == 'relay') htmlCodeRelay += moduleCode;
		if (type == 'sensor') htmlCodeSensor += moduleCode;
	}
    container_map.innerHTML = htmlCodeMap;
	container_relay.innerHTML = htmlCodeRelay;
	container_sensor.innerHTML = htmlCodeSensor;
}

// 2. SET DATA Plan
function SetDataPlan(json) {
    var container_plan = document.querySelector('#container-plan');
    htmlCode = '';
    for (var i = 0; i < json.length; i++) {

        // TODO Сократить
        //var daysText = json[i].PlanDays.split(' ');
        // var daysList = [];
        // for (var k = 0; k < daysText.length; k++) {
        //     daysList.push(daysText[k]);
        // }
        // var finalDaysList = daysList.join(' ');
        var daysCode = `<div id="days" style="padding-bottom: 10px;">${json[i].PlanDays}</div>`;

        // TODO Сократить
        var timeText = json[i].PlanTime.split(' ');
        var timeCode = '';
        if (timeText.length >= 1) {
            timeCode += `<div id="time-start" style="display: inline-block;">${timeText[0]}</div>`;
        } 
        if (timeText.length == 2) {
            timeCode += `<div style="display: inline-block;"> - </div>
                        <div id="time-end" style="display: inline-block;">${timeText[1]}</div>`;
        }

        htmlCode += `<div class="item-module panel">
                            <div id="ip">${json[i].ModuleIp}</div>
                            <div style="display: inline-block; padding: 35px 0 10px 10px;">
                                <div id="time" style="font-size: 23px; color: #e0641c;">
                                    ${timeCode}
                                </div>
                                <div id="id" style="display: none;">${json[i].PlanId}</div>
                                ${daysCode}
                                <div id="text-disc">${json[i].PlanDisc}</div>
                            </div>
                            <div style="display: inline-block; vertical-align: top;padding: 35px 10px 10px 10px;">
                                <img class="button-image" src="/static/img/edit.png" onclick="EditPlan(this)">
                            </div>
                        </div>`
    }
    container_plan.innerHTML = htmlCode;
}

// 2. SET DATA Reminder
function SetDataReminder(json) {
    var container_plan = document.querySelector('#container-reminder');
    htmlCode = '';
    for (var i = 0; i < json.length; i++) {
        listReminder = json[i].ReminderList.split('[DEL]').join('<br>')
		htmlCode += `<div class="item-module panel" style="min-width: 147px;" id="module-${json[i].ReminderId}">
                        <div id="type">Блок напоминания</div>
                        <div style="display: inline-block;padding: 35px 10px 10px 10px;margin-right: 40px;">
                            <div id="id" style="display: none;">${json[i].ReminderId}</div>
                            <div id="disc">${json[i].ReminderDisc}</div>
                            <div id="user" style="color: #50b925;">${json[i].ReminderUser}</div>
                            <div style="background: #b7b7b7;height: 2px;width: 100%;margin-top: 15px;"></div>
    		                <div id="reminder-list" style="padding-top: 15px;">${listReminder}</div>
                        </div>
                        <div style="display: inline-block; vertical-align: top;padding: 35px 10px 10px 10px;position: absolute;right: 0;">
    		                <img class="button-image" src="/static/img/edit.png" onclick="EditReminder(this)">
    		            </div> 
    		        </div>`;
    }
    container_plan.innerHTML = htmlCode;
}

// КАРТА ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function SavePositionMarker() {
	var childrenMap = document.getElementById("container-map").children;
	for (var i = 0; i < childrenMap.length; i++) {
		var id = childrenMap[i].id.split('-')[1];
		var marker = document.querySelector('#marker-' + id);
		var form = document.querySelector('#module-' + id);

		var left = parseInt(marker.style.left);
	    var top = parseInt(marker.style.top);

	    if (form.querySelector('#left').innerHTML == left && 
	    	form.querySelector('#top').innerHTML == top) continue;

	    form.querySelector('#left').innerHTML = left;
	    form.querySelector('#top').innerHTML = top;

	    setData = {}
	    setData['function'] = 'set_module';
	    setData['name'] = form.querySelector('#name').innerHTML;
	    setData['user'] = form.querySelector('#user').innerHTML;
	    setData['id'] = id;
	    setData['ip'] = form.querySelector('#ip').innerHTML;
	    setData['type'] = form.querySelector('#type').innerHTML;

	    var color = form.querySelector('#color').innerHTML;
	    setData['mapdata'] = left + '|' + top + '|' + color;

		var req = GetXmlHttp();
	    req.onreadystatechange = function() {  
	        if (req.readyState == 4) { 
	            if(req.status != 200) { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
	        }
	    }
	    var json_string = JSON.stringify(setData);
	    SendRequest(req, json_string);
	}
}

function UpdateMapParameter(element, nameElement) {
    editForm = element.parentNode.parentNode;
    var id = editForm.querySelector('#edit-id').value;
    var marker = document.querySelector('#marker-' + id);
    if (nameElement == 'left') {
        marker.style.left = element.value + 'px';
    }
    if (nameElement == 'top') {
        marker.style.top = element.value + 'px';
    }
    if (nameElement == 'color') {
        marker.style['background-color'] = element.value;
    }
}

// НИЖЕ ПЕРЕМЕЩЕНИЕ ПО КАРТЕ МАРКЕРОВ
isChangePositionMarker = false
function ChangeStatePositionMarker(element) {
    if (isChangePositionMarker) {
        element.parentNode.querySelector('#edit-info').style.display = "none";
        element.src = "/static/img/edit.png";
        ResetSelect();
        SavePositionMarker();
        isChangePositionMarker = false;
    } else {
        element.parentNode.querySelector('#edit-info').style.display = "block";
        element.src = "/static/img/save.png";
        isChangePositionMarker = true;
    }
}
function ResetSelect(){
    var c = document.getElementById("container-map").children;
    var i;
    for (i = 0; i < c.length; i++) {
        c[i].style.border = 'none';
        c[i].style.margin = '0px';
    }
}
var dragObject, mouseOffset;
function mouseUp(){
    dragObject.onmousemove = null;
    dragObject.onmouseup = null;
    dragObject.querySelector('.marker-desc').style.display = null;
    dragObject = null;
    mouseOffset = {x:0, y:0};
}
function mouseMove(element){
    if (dragObject) {
        dragObject.style.top = element.pageY - mouseOffset.y + 'px';
        dragObject.style.left = element.pageX - mouseOffset.x + 'px';
    }
}
function mouseDown(element) {
    if (!isChangePositionMarker) return;
    ResetSelect();
    dragObject = element;
    element.style.border = '1px solid #57e0ff';
    element.style.margin = '-1px 0 0 -1px';
    element.querySelector('.marker-desc').style.display = 'none';
    mouseOffset = {x:event.pageX - dragObject.offsetLeft, y:event.pageY - dragObject.offsetTop};
    dragObject.onmousemove = mouseMove;
    dragObject.onmouseup = mouseUp;
}
// КАРТА ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ВКЛАДКИ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function OpenTab(nubmerTab, element) {
    var tabs = document.querySelectorAll(".nav-tab");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].style.display = "none";
    }

    document.querySelector("#tab" + nubmerTab).style.display = "block";
    
    var tabsButton = element.parentNode.querySelectorAll(".tab-button");
    for (var i = 0; i < tabsButton.length; i++) {
        tabsButton[i].classList.remove("button-active");
    }
    element.classList.add("button-active");
}
// ВКЛАДКИ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~