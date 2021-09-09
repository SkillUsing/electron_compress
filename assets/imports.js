const links = document.querySelectorAll('link[rel="import"]')

// 导入并将每个页面添加到DOM中 
//! html import 由Google 2020年2月份被删除,所以新版本的electron都不再支持 link.import 属性,如果想使用需要还原到7.4的版本。
//! 所以这里采用另一种单页面方式,就是实现页面或者共享功能会复杂一些。
Array.prototype.forEach.call(links, function(link) {
    let template = link.import.querySelector('.task-template')
    let clone = document.importNode(template.content, true);
    if (link.href.match('login.html')) {
        document.querySelector('body').appendChild(clone)
    } else {
        document.querySelector('.content').appendChild(clone)
    }
})