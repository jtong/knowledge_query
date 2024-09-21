const path = require('path');
const { updateCondition } = require('../../../index.js');

module.exports = async function(given, testFilePath) {
    const testCaseDir = path.dirname(testFilePath);
    const dslFilePath = path.resolve(testCaseDir, given.dsl_file);
    
    const { originalDSL, updates } = require(dslFilePath);
    
    // 执行更新操作
    const updatedDSL = updateCondition(originalDSL, updates);
    // console.log(JSON.stringify(updatedDSL, null, 2));
    // 返回更新结果
    return {
        updatedDSL
    };
};