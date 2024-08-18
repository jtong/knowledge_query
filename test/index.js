// test/index.js
const { runTests } = require('./test-framework.js');
const path = require('path');
const fs = require('fs');
const sinon = require('sinon');
const { handleKnowledgeSpaceOperation } = require('../index.js');

const now = new Date(2024, 2, 17, 12, 55, 48); // 日期设置为 2024 年 3 月 17 日
const clock = sinon.useFakeTimers(now.getTime());

const config = {
    casesDirectory: "test/cases",
    testFunction: async (given, testFilePath) => {
        const casesDirectory = config.isDebugMode ? path.resolve(config.casesDirectory, 'debug') : config.casesDirectory;
        
        // Determine the case folder from the test file path
        const caseFolder = path.dirname(path.relative(path.resolve(__dirname,  "..", casesDirectory), testFilePath));

        const testCaseDir = path.resolve(__dirname, "..", casesDirectory, caseFolder);

         // Load DSL query
         const dslFile = given.dsl_file || 'dsl.json';
         const inputDslFilePath = path.resolve(testCaseDir, dslFile);
         const inputDsl = require(inputDslFilePath);
 
         // Load knowledge space
         const repoFile = given.repo_file || 'repo.json';
         const inputRepoFilePath = path.resolve(testCaseDir, repoFile);
         const knowledgeSpace = require(inputRepoFilePath);
         
         // Use the handleKnowledgeSpaceOperation function with the provided inputs
         const result = handleKnowledgeSpaceOperation(inputDsl.dslQuery, knowledgeSpace);
         return result;
    },
    isDebugMode: process.env.DEBUG_MODE === 'true',
};

runTests(config);