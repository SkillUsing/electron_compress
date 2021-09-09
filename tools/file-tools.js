
// 获取文件名
exports.getFileName = function(name) {
    let fileName = "";
    if (process.platform == 'win32') {
        fileName = name.replace(/(.*\\)*([^.]+).*/ig, "$2");
    } else {
        fileName = name.replace(/(.*\/)*([^.]+).*/ig, "$2");
    }
    return fileName;
};

// 获取 .后缀名
exports.getExtension = function(name) {
    return name.substring(name.lastIndexOf("."))
}

// 只获取后缀名
exports.getExtensions= function(name) {
    return name.substring(name.lastIndexOf(".") + 1)
}





