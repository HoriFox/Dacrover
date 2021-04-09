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

timeAgo = 0;

function AddCreateBlockModule(block) {
    editForm = document.querySelector('#input-form-module-template').cloneNode(true);
    editForm.id = 'input-form-module';
    editForm.querySelector('#confirm').onclick = function() { ConfirmEditModule(this); };
    editForm.querySelector('#cancel').onclick = function() { CloseEditModule(this); };
    document.querySelector('#' + block).append(editForm);
}

function AddCreateBlockPlan(block) {
    editForm = document.querySelector('#input-form-plan-template').cloneNode(true);
    editForm.id = 'input-form-plan';
    editForm.querySelector('#confirm').onclick = function() { ConfirmEditPlan(this); };
    editForm.querySelector('#cancel').onclick = function() { CloseEditPlan(this); };
    document.querySelector('#' + block).append(editForm);
}

function EditModule(element) {
    container = element.parentNode.parentNode;
    container.style.display = 'none';

    editForm = document.querySelector('#input-form-module-template').cloneNode(true);
    editForm.id = 'input-form-module';
    editForm.querySelector('#edit-name').value = container.querySelector('#name').innerHTML;
    editForm.querySelector('#edit-room').value = container.querySelector('#room').innerHTML;
    editForm.querySelector('#edit-id').value = container.querySelector('#id').innerHTML;
    editForm.querySelector('#edit-ip').value = container.querySelector('#ip').innerHTML;
    editForm.querySelector('#edit-type').value = container.querySelector('#type').innerHTML;
    editForm.querySelector('#edit-left').value = container.querySelector('#left').innerHTML;
    editForm.querySelector('#edit-top').value = container.querySelector('#top').innerHTML;
    editForm.querySelector('#edit-color').value = container.querySelector('#color').innerHTML;
    
    container.after(editForm);
}

function ConfirmEditModule(buttonConfirm, type = 'create') {
    editForm = buttonConfirm.parentNode.parentNode;
    
    var editId = editForm.querySelector('#edit-id').value;
    var idModule = editId == '' ? 'NULL' : editId;

    // Получение данных, отправка на сервер изменений, если успешно, продолжить
    setData = {}
    setData['function'] = 'set_module';
    setData['name'] = editForm.querySelector('#edit-name').value;
    setData['room'] = editForm.querySelector('#edit-room').value;
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
                CloseEditModule(buttonConfirm, type);
                Refresh();
            }
            else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
        }
    }
    var json_string = JSON.stringify(setData);
    SendRequest(req, json_string);
}

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
	            if(req.status == 200) { Refresh(); }
	            else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
	        }
	    }
	    var json_string = JSON.stringify(deleteData);
        SendRequest(req, json_string);
    }
}

function CloseEditModule(buttonCancel, type = 'edit') {
    editForm = buttonCancel.parentNode.parentNode;
    if (type == 'edit') editForm.previousElementSibling.style.display = 'inline-block';
    editForm.remove();
}

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
                CloseEditPlan(buttonConfirm, type);
                Refresh();
            }
            else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
        }
    }
    var json_string = JSON.stringify(setData);
    SendRequest(req, json_string);
}

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
                if(req.status == 200) { Refresh(); }
                else { notif(req.status ? req.statusText : 'Запрос не удался', 'Ошибка', 'warning'); return;}
            }
        }
        var json_string = JSON.stringify(deleteData);
        SendRequest(req, json_string);
    }
}

function CloseEditPlan(buttonCancel, type = 'create') {
    container = buttonCancel.parentNode.parentNode;
    if (type == 'edit') container.previousElementSibling.style.display = 'inline-block';
    container.remove();
}

function Refresh() {
	GetDataModuleAndMap();
    GetDataPlan();
    timeAgo = 0;
    document.querySelector('#status-refresh').innerHTML = 'Последнее обновление - 0 секунд назад';
}

function UpdageTimeAgo() {
    timeAgo += 5;
    document.querySelector('#status-refresh').innerHTML = 'Последнее обновление - ' + timeAgo + ' секунд назад';
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

// Публичная функция ЗАПРОСА К ДАТЧИКУ
function UpdateSensor() {
	// container = buttonSwitch.parentNode.parentNode;
	// var ip = container.querySelector('#ip').innerHTML;
	// if (value == 0) {
 //        SendRequestRelay(ip, 0);
	// } else {
 //        SendRequestRelay(ip, 1);
	// }
}

// Исполнитель ЗАПРОС К ДАТЧИКУ
function SendRequestSensor(ip) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/', true);
    xhr.onreadystatechange = function() {  
        if (xhr.readyState == 4) { 
            if(xhr.status == 200) {
            	if (xhr.responseText == 'error-connection-ip') {
            		notif('Нет подключения к указанному ip', 'Ошибка', 'warning');
            	}
        	}
        }
    }
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({"type":"sensor", "ip":ip.toString()}));
}

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

function SetDataModuleAndMap(json) {
    var container_map = document.querySelector('#container-map');
	var container_relay = document.querySelector('#container-module-reley');
	var container_sensor = document.querySelector('#container-module-sensor');
    htmlCodeMap = '';
	htmlCodeRelay = '';
	htmlCodeSensor = '';
	for (var i = 0; i < json.length; i++) {
		var type = '';
		var imgModule = '';
		if (json[i].ModuleType == 'Реле-свет') imgModule = '/static/img/switch.png';
		if (json[i].ModuleType == 'Реле-розетка') imgModule = '/static/img/socket.png';
        if (json[i].ModuleType == 'Датчик температуры') imgModule = '/static/img/temp.png';
        if (json[i].ModuleType == 'Датчик газа') imgModule = '/static/img/temp.png';

		var contentModule = ''
		if (json[i].ModuleType == 'Реле-свет' || json[i].ModuleType == 'Реле-розетка') {
			contentModule = `<div class="ibutton ibutton-on" style="margin-top: 5px;" onclick="SendRequestRelay('${json[i].ModuleIp}', '1')">Включить</div>
		                    <div class="ibutton ibutton-off" style="margin-top: 5px;" onclick="SendRequestRelay('${json[i].ModuleIp}', '0')">Выключить</div>`;
		    type = 'relay';
		}
		if (json[i].ModuleType == 'Датчик температуры' || json[i].ModuleType == 'Датчик газа') {
			contentModule = `<div style="font-size: 20px; padding-top: 8px; color: #e0641c;">Нет данных</div>`;
            // 9°
			type = 'sensor';
		}

        var mapData = json[i].MapData.split('|');

		var moduleCode = `<div class="item-module" id="module-${json[i].ModuleId}">
                            <div id="ip">${json[i].ModuleIp}</div>
                            <div id="type">${json[i].ModuleType}</div>
    		                <img class="item-image" src="${imgModule}" style="padding: 35px 0 10px 10px;">
    		                <div style="display: inline-block; padding: 35px 0 10px 10px;">
    		                    <div id="name">${json[i].ModuleName}</div>
    		                    <div id="room" style="color: #50b925;">${json[i].Room}</div>
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
	    setData['room'] = form.querySelector('#room').innerHTML;
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

        htmlCode += `<div class="item-module">
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