const path = require('path');
const glob = require('glob');
const ffmpeg = require("fluent-ffmpeg");
const { app, BrowserWindow, desktopCapturer, ipcMain, dialog } = require('electron');

const route = require('./router/route');
const { getFileName } = require("./tools/file-tools");


const debug = /--debug/.test(process.argv[2]);

var isGpu = false;

var type = "h.264";

var list = [];

var successlistIndex = [];

let working = false;

var mainWindow = null;

function initialize() {
    var shouldQuit = makeSingleInstance();
    if (shouldQuit)
        return app.quit();

    loadAllMainJs();

    function createWindow() {
        var windowOptions = {
            width: 1080,
            minWidth: 680,
            height: 840,
            title: app.getName(),
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            }
        };

        if (process.platform === 'linux') {
            windowOptions.icon = path.join(__dirname, '/assets/app-icon/png/512.png')
        }

        mainWindow = new BrowserWindow(windowOptions);
        let login = path.join('file://', __dirname, '/views/compress/compress.html')

        

        mainWindow.loadURL(login);

        if (debug) {
            mainWindow.webContents.openDevTools();
            mainWindow.maximize();
            require('devtron').install();
        }

        mainWindow.on('closed', function () {
            mainWindow = null;
        });
    }

    // 创建 window
    app.whenReady().then(() => {
        createWindow();
        createRouter(route.routerConfig);
    });

    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', function () {
        if (mainWindow === null) {
            createWindow();
        }
    });
}


function makeSingleInstance() {
    if (process.mas)
        return false;
    if (!app.requestSingleInstanceLock()) {
        app.quit();
    } else {
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // 当运行第二个实例时,将会聚焦到myWindow这个窗口
            if (myWindow) {
                if (myWindow.isMinimized()) myWindow.restore()
                myWindow.focus()
            }
        })
    }
}


function createRouter(router) {
    router.forEach(route => {
        ipcMain.on(route.url, (event, arg) => {
            let urlPath = path.join(__dirname, route.html);
            console.log(urlPath);
            mainWindow.loadFile(path.join(__dirname, route.html));
        });
    });
}

/**加载所有主渲染进程下需要使用的js */
function loadAllMainJs() {
    var files = glob.sync(path.join(__dirname, 'process/main/**/*.js'));
    files.forEach(function (file) {
        require(file);
    });
}


ipcMain.on('page-end', (event, arg) => {
    event.reply('pag-end-over', __dirname);
})


ipcMain.on('add-compress-path-output', (event, arg) => {
    dialog.showOpenDialog({
        title: "请选择输出的文件夹",
        properties: ['openDirectory']
    }).then(res => {
        if (!res.canceled) {
            if (process.platform == 'win32')
                videoOutput = res.filePaths[0] + "\\";
            else
                videoOutput = res.filePaths[0] + "/";
            event.reply('videoOutPutEnd', videoOutput);
        }
    });
});

ipcMain.on('add-compress-path-input', (event, arg) => {
    dialog.showOpenDialog({
        title: "请选择要转换的文件",
        properties: ['openFile', "multiSelections"],
        filters: [
            { name: 'Movies', extensions: ['mkv', 'avi', 'mp4', 'mts'] },
        ]
    }).then(res => {
        if (!res.canceled) {

            res.filePaths.forEach(item => {
                list.push(item);
            });

            event.reply('videoInputEnd', [list, successlistIndex]);
        }
    });
});

ipcMain.on("clear-list", (event, arg) => {
    if (arg.length == 0) {
        list = [];
    }
    list = list.filter(c => !arg.includes(c));
    event.reply('videoInputEnd', [list, successlistIndex]);
})

ipcMain.on("chagne-compress-gpu", (event, arg) => {
    console.log("是否使用GPU:" + arg)
    isGpu = arg;
})

ipcMain.on("start-compress", (event, arg) => {

    event.reply("CompressLoading", true);

    let taskIndex = 0;

    let startTask = setInterval(() => {
        if (working)
            return;

        if (taskIndex <= list.length - 1) {
            if (successlistIndex.includes(taskIndex)) {
                taskIndex++;
                return;
            }
            StartCompress(event, list[taskIndex], arg);
            taskIndex++;
        } else {
            clearInterval(startTask);
            event.reply("CompressLoading", false);
        }
    }, 1000);
})

ipcMain.on("compress-type-change", (event, arg) => {
    type = arg;
    event.reply("compress-type-change-end", type);
})


function StartCompress(event, videoInput, videoOutput) {

    let outPutFile = videoOutput + getFileName(videoInput) + ".mp4";

    console.log("videoInput  " + videoInput);

    console.log("videoOutput  " + outPutFile);

    if (videoInput == undefined || videoOutput == undefined)
        return;

    working = true;

    let itemIndex = list.findIndex(c => c == videoInput);


    var com = ffmpeg();
    var ffmpegPath = "";
    if (process.platform == 'win32') {
        ffmpegPath = path.join(__dirname, 'libs/windows/ffmpeg.exe');
    } else {
        ffmpegPath = path.join(__dirname, 'libs/osx/ffmpeg');
    }

    var vcode = "libx265";
    //ffmpeg -codecs 查看所有编码
    if (process.platform == 'win32') {
        ffmpegPath = path.join(__dirname, 'libs/windows/ffmpeg.exe');
        if (type == "h.264") {
            vcode = isGpu ? "h264_nvenc" : "libx264";
        } else {
            vcode = isGpu ? "hevc_nvenc" : "libx265";
        }
    } else {
        ffmpegPath = path.join(__dirname, 'libs/osx/ffmpeg');

        if (type == "h.264") {
            vcode = isGpu ? "h264_videotoolbox" : "libx264"; //macos的硬件解码有点问题
        } else {
            vcode = isGpu ? "hevc_videotoolbox" : "libx265"; //macos的硬件解码有点问题
        }
    }

    //http://www.mediacoderhq.com/dlfull.htm
    //ffmpeg.exe -y -i D:\2\2.mp4 -vcodec rawvideo -pix_fmt yuv444p D:\2\3.yuv 
    //ffmpeg -i D:\2\2.mp4 -c:v libx264 -x264-params preset=veryslow:crf=18:tune=film:qcomp=0.6:profile=high:level=5:aq-mode=2:aq-strength=0.8 -c:a copy -color_primaries 5 -colorspace 6 -color_trc 6 D:\2\9.mp4
    //ffmpeg -y -i D:\2\2.mp4 -c:v hevc_nvenc -x264-params preset=veryslow:crf=18:tune=film:qcomp=0.6:profile=high:level=5:aq-mode=2:aq-strength=0.8 -c:a copy  -colorspace 1  D:\2\9.mp4
    //这样没有丢失原图色彩
    //ffmpeg -y -i D:2\2.mp4 -vcodec h264_nvenc -acodec copy -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range pc -bsf:v h264_metadata=video_full_range_flag=1:colour_primaries=9:transfer_characteristics=1:matrix_coefficients=9 D:\2\9.mp4
    //查看原视频信息
    //ffprobe -show_streams D:\2\2.mp4
    ///ffmpeg -i -y D:\2\2.mp4 -c:v hevc_nvenc -c:a copy -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range pc -bsf:v D:\2\9.mp4


    //ffmpeg -y -i D:\2\2.mp4 -vf geq=lum='p(X,Y)':cb=128:cr=128 D:\2\9.mp4
    com.setFfmpegPath(ffmpegPath)
        .input(videoInput)
        // .inputOption([
        //     //"-hwaccel cuvid",
        //     // "-c:v hevc_cuvid"
        //     "-c:v copy"
        // ])
        //.videoCodec("hevc_nvenc")
        .videoCodec(vcode)
        .audioCodec("aac")
        .outputOptions([
            "-crf 0",
            // "-b:v 1M",
            // "-maxrate 1M"
        ])
        .output(outPutFile)
        .on('start', (commandLine) => {

            console.log('使用命令: ' + commandLine);
        })
        .on('progress', (progress) => {
            console.log('当前进度:' + progress.percent + '%');
            event.reply("videoCompressProgress", [videoInput, progress.percent])
        })
        .on('end', (stdout, stderr) => {
            console.log('转码成功!');
            event.reply("videoCompressProgress", [videoInput, 100]);
            working = false;
            successlistIndex.push(itemIndex);
            com.kill();
        }).on('error', function (err, stdout, stderr) {
            console.log('Cannot process video: ' + err.message);
            working = false;
            com.kill();
        }).run();
}

// 处理Windows启动事件中
switch (process.argv[1]) {
    case '--squirrel-install':
        autoUpdater.createShortcut(function () { app.quit() })
        break
    case '--squirrel-uninstall':
        autoUpdater.removeShortcut(function () { app.quit() })
        break
    case '--squirrel-obsolete':
    case '--squirrel-updated':
        app.quit()
        break
    default:
        initialize()
}

// 热更新
try {
    require('electron-reloader')(module, {});
} catch (_) { }