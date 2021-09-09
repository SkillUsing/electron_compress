const { ipcRenderer } = require('electron');

const { getFileName, getExtensions } = require("../../tools/file-tools");

let list = [];

let working = false;

function listChange() {
    if (list.length > 0) {
        let details = document.getElementById('vide_table_details');
        let tab_details = document.getElementById('tab_con_details')
        details.style.display = 'block';
        tab_details.style.display = 'none';
    } else {
        let details = document.getElementById('vide_table_details');
        let tab_details = document.getElementById('tab_con_details')
        details.style.display = 'none';
        tab_details.style.display = 'flex';
    }
}

document.getElementById("clearList").addEventListener("click", () => {
    if (working)
        return;
    ipcRenderer.send("clear-list", []);
});

function Add_Files() {
    ipcRenderer.send('add-compress-path-input');
}

document.getElementById('o').addEventListener('click', () => {
    ipcRenderer.send('add-compress-path-output');
});

document.getElementById('codeType').addEventListener('change', (e) => {
    let selectItem = document.getElementById("codeType");
    var index = selectItem.selectedIndex;
    ipcRenderer.send("compress-type-change", selectItem.options[index].text);
})

document.getElementById('isCpu').addEventListener('click', (e) => {
    ipcRenderer.send("chagne-compress-gpu", false);
})

document.getElementById('isGpu').addEventListener('click', (e) => {
    ipcRenderer.send("chagne-compress-gpu", true);
})


document.getElementById('startCompress').addEventListener('click', () => {
    //var videoInput = document.getElementById("cFile").value;
    var videoOutput = document.getElementById("oFile").value;
    ipcRenderer.send("start-compress", videoOutput);
})


ipcRenderer.on("CompressLoading", (event, arg) => {
    document.getElementById("startCompress").disabled = arg;
    document.getElementById("codeType").disabled = arg;
    document.getElementById("isCpu").disabled = arg;
    document.getElementById("isGpu").disabled = arg;
    document.getElementById("clearList").disabled = arg;
});


ipcRenderer.on("videoInputEnd", (event, arg) => {
    list = arg[0];
    listChange();
    videoListHtmlBuild(list, arg[1]);
});

ipcRenderer.on("videoOutPutEnd", (event, arg) => {
    document.getElementById("oFile").value = arg;
});

ipcRenderer.on("videoCompressProgress", (event, arg) => {
    if (arg[1] == undefined)
        return;
    let itemIndex = list.findIndex(c => c == arg[0]);
    document.getElementById(`cMeter${itemIndex}`).value = arg[1];
});


ipcRenderer.on("compress-type-change-end", (event, arg) => {
    document.getElementById("type").value = arg;
})


function removeItem(item, i) {
    if (working)
        return;
    ipcRenderer.send("clear-list", [item]);
}



function videoListHtmlBuild(list, successIndexList) {

    document.getElementById("listShow").innerHTML = "";

    list.forEach((item, index) => {
        let row = document.createElement("tr");
        //编号
        let td1 = document.createElement("td");
        td1.innerHTML = index + 1;
        row.appendChild(td1);
        //文件名称
        let td2 = document.createElement("td");
        td2.setAttribute("value", getFileName(item));

        td2.innerHTML = getFileName(item);

        row.appendChild(td2);
        //文件格式
        let td3 = document.createElement("td");
        td3.setAttribute("value", getExtensions(item));
        td3.innerHTML = getExtensions(item);
        row.appendChild(td3);
        //进度
        let td4 = document.createElement("td");
        let meter = document.createElement("meter");
        meter.setAttribute("id", `cMeter${index}`);

        if (successIndexList.includes(index)) {
            meter.setAttribute("value", "100");
        } else {
            meter.setAttribute("value", "0");
        }

        meter.setAttribute("min", "0");
        meter.setAttribute("max", "100");
        td4.appendChild(meter);
        row.appendChild(td4);

        //操作
        let td5 = document.createElement("td");
        let tools = document.createElement("span")
        tools.setAttribute("style", "color: red; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;  font-size: 18px;");
        tools.setAttribute("onclick", `removeItem("${item}", ${index})`);
        tools.innerHTML = "X";
        td5.appendChild(tools);
        row.appendChild(td5);

        document.getElementById("listShow").appendChild(row);
    })
}



// tab切换
var nav_ul = document.querySelector('.nav_ul');
var lis = nav_ul.querySelectorAll('li');
var con = document.querySelectorAll('.tab_li_con');
for (var i = 0; i < lis.length; i++) {
    lis[i].setAttribute('index', i);
    lis[i].onclick = function () {
        for (var i = 0; i < lis.length; i++) {
            lis[i].className = '';
        }
        this.className = 'nav_hovst_li';
        var index = this.getAttribute('index');
        for (var i = 0; i < con.length; i++) {
            con[i].style.display = 'none';
        }
        con[index].style.display = 'block';
    }
}