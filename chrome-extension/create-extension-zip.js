// 这个脚本用于创建Chrome扩展的下载包
// 在实际部署时，可以用这个脚本生成zip文件供用户下载

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function createExtensionZip() {
    const output = fs.createWriteStream('amazon-product-extractor.zip');
    const archive = archiver('zip', {
        zlib: { level: 9 } // 设置压缩级别
    });

    output.on('close', function() {
        console.log('扩展包已创建: amazon-product-extractor.zip');
        console.log('文件大小: ' + archive.pointer() + ' bytes');
    });

    archive.on('error', function(err) {
        throw err;
    });

    archive.pipe(output);

    // 添加所有扩展文件
    archive.file('manifest.json', { name: 'manifest.json' });
    archive.file('content.js', { name: 'content.js' });
    archive.file('popup.html', { name: 'popup.html' });
    archive.file('popup.js', { name: 'popup.js' });
    archive.file('README.md', { name: 'README.md' });
    archive.file('INSTALL.md', { name: 'INSTALL.md' });
    
    // 添加图标文件（如果存在）
    if (fs.existsSync('icon16.png')) archive.file('icon16.png', { name: 'icon16.png' });
    if (fs.existsSync('icon48.png')) archive.file('icon48.png', { name: 'icon48.png' });
    if (fs.existsSync('icon128.png')) archive.file('icon128.png', { name: 'icon128.png' });

    archive.finalize();
}

// 如果直接运行此脚本
if (require.main === module) {
    createExtensionZip();
}

module.exports = createExtensionZip;