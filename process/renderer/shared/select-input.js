const { ipcRenderer } = require('electron');

const videoSelectBtn = document.getElementById('input-select-video');
const audioSelectBtn = document.getElementById('input-select-audio');
const gotoLoginBtn = document.getElementById('goto-login');
const gotoVideoBtn = document.getElementById('goto-video');
const loginBtn = document.getElementById('get-started');
const gotoBlankBtn = document.getElementById('goto-blank');

videoSelectBtn?.addEventListener('click', () => {
    GetVideoInputArray();
})

audioSelectBtn?.addEventListener('click', () => {
    GetAudioInputArray();
})

gotoLoginBtn?.addEventListener('click', () => {
    console.log("true");
    ipcRenderer.send('login-page');
})

gotoVideoBtn?.addEventListener('click', () => {
    ipcRenderer.send('video-pasge');
})

loginBtn?.addEventListener("click", () => {
    ipcRenderer.send("compress");
})

gotoVideoBtn?.addEventListener('click', () => {
    ipcRenderer.send('video-page');
})

gotoBlankBtn?.addEventListener('click', () => {
    ipcRenderer.send('blank-page');
})

function GetVideoInputArray() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => devices.filter(d => d.kind === 'videoinput'))
        .then(devices => console.log(devices))
}

function GetAudioInputArray() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => devices.filter(d => d.kind === 'audioinput'))
        .then(devices => console.log(devices))
}