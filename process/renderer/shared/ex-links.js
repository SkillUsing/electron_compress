const shell = require('electron').shell

const links = document.querySelectorAll('a[href]')

//将所有的http请求,通过外部浏览器打开。
Array.prototype.forEach.call(links, function(link) {
    const url = link.getAttribute('href')
    if (url.indexOf('http') === 0) {
        link.addEventListener('click', function(e) {
            e.preventDefault()
                //在用户的默认浏览器中打开 URL
            shell.openExternal(url)
        })
    }
})