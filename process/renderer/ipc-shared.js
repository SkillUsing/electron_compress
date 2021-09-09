const  {ipcRenderer}  = require('electron');
const glob = require('glob');
const path = require('path');

ipcRenderer.on('pag-end-over', (event, arg) => {
     console.log(arg);
    // console.log(path.join(arg, 'process/renderer/shared/*.js'));
    var files = glob.sync(path.join(arg, 'process/renderer/shared/*.js'));
    files.forEach(function(file) {
        require(file);
    });
});

ipcRenderer.send('page-end', 'ready');