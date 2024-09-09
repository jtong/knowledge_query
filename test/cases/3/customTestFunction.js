const path = require('path');
const { handleKnowledgeSpaceOperation } = require('../../../index.js');

module.exports = async function(given, testFilePath) {
    const testCaseDir = path.dirname(testFilePath);
    const dslFilePath = path.resolve(testCaseDir, given.dsl_file);
    const repoFilePath = path.resolve(testCaseDir, given.repo_file);
    
    const { dslQuery } = require(dslFilePath);
    const knowledgeSpace = require(repoFilePath);
    
    const operationConfig = { repoFilePath };
    
    // 执行更新操作
    const updateResult = await handleKnowledgeSpaceOperation(dslQuery, knowledgeSpace, operationConfig);

    // 返回更新结果和整个知识空间
    return {
        updateResult,
        knowledgeSpace
    };
};