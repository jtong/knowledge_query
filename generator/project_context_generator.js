const fs = require('fs');
const path = require('path');
const { prompt_render_with_config_object } = require('prompt-context-builder');

function generateContext(config) {
    // 直接使用 __dirname 获取当前目录
    const templatePath = path.join(__dirname, 'context_template.md');
    
    // 读取模板文件
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    try {
        // 直接使用 config 对象渲染模板
        const renderedContent = prompt_render_with_config_object(templateContent, config, '', config.project.base_path);

        // 返回渲染后的内容
        return renderedContent;
    } catch (error) {
        console.error('Error generating context:', error);
        throw error;
    }
}

module.exports = generateContext;