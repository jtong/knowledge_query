const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('mocha');
const yaml = require('js-yaml');

const workspaceRoot = path.resolve(__dirname, "../");

exports.runTests = function (config) {
    const testcaseDirectory = config.isDebugMode ? path.resolve(config.casesDirectory, 'debug') : config.casesDirectory;
    const fullTestcaseDirectory = path.resolve(workspaceRoot, testcaseDirectory);

    // 获取所有子文件夹
    const testFiles = findTestFiles(fullTestcaseDirectory);

    describe('Data Driven Tests', function () {
        testFiles.forEach(file => {
            const filePath = path.resolve(workspaceRoot, testcaseDirectory, file);
            const testCase = yaml.load(fs.readFileSync(filePath, 'utf8'));

            it(testCase.desc, async function () {
                this.timeout(10000);
                
                let customTestFunction, customValidator;
                
                // 加载自定义测试函数（如果存在）
                if (testCase.customTestFunctionPath) {
                    const functionPath = path.resolve(path.dirname(filePath), testCase.customTestFunctionPath);
                    customTestFunction = require(functionPath);
                }
                
                // 加载自定义验证函数（如果存在）
                if (testCase.customValidatorPath) {
                    const validatorPath = path.resolve(path.dirname(filePath), testCase.customValidatorPath);
                    customValidator = require(validatorPath);
                }
                
                // 执行测试函数
                const testFunction = customTestFunction || config.testFunction;
                const result = await testFunction(testCase.given, filePath);

                // 执行验证
                if (customValidator) {
                    customValidator(result, testCase);
                } else if (config.customValidator) {
                    config.customValidator(result, testCase);
                } else {
                    // 使用默认的验证逻辑
                    validateResult(result, testCase);
                }
            });
        });
    });
};

function findTestFiles(directory) {
    const testFiles = [];

    function traverseDirectory(dir) {
        const files = fs.readdirSync(dir, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
                traverseDirectory(fullPath);
            } else if (file.name === 'test.yaml') {
                testFiles.push(fullPath);
            }
        }
    }

    traverseDirectory(directory);
    return testFiles;
}

function validateResult(result, testCase) {
    const { then } = testCase;
    Object.keys(then).forEach(key => {
        if (key === 'ruleMatch') {
            handleRuleMatch(result, then[key]);
        } else {
            // 对于除ruleMatch外的其他键进行默认相等验证
            expect(result[key]).to.deep.equal(then[key]);
        }
    });
}

function handleRuleMatch(result, rules) {
    // 处理ruleMatch规则
    rules.forEach(rule => {
        const actualValue =  rule.target && rule.target !== '' ? getNestedProperty(result, rule.target) : result;

        // 根据rule.type处理不同的验证逻辑
        switch (rule.type) {
            case "hasKey":
                expect(actualValue, `Expected object to have key '${rule.value}'`).to.have.property(rule.value);
                break;
            case "isArray":
                expect(actualValue, `Expected '${rule.target || 'result'}' to be an array`).to.be.an('array');
                break;
            case "lengthEquals":
                expect(actualValue.length, `Expected length to be ${rule.value}, but got ${actualValue.length}`).to.equal(rule.value);
                break;
            case "lengthNotGreaterThan":
                expect(actualValue.length, `Expected length to be at most ${rule.value}, but got ${actualValue.length}`).to.be.at.most(rule.value);
                break;
            case "lengthGreaterThan":
                expect(actualValue.length, `Expected length to be greater than ${rule.value}, but got ${actualValue.length}`).to.be.greaterThan(rule.value);
                break;
            case "isObject":
                expect(actualValue, `Expected '${rule.target || 'result'}' to be an object`).to.be.an('object');
                break;
            case "stringEqualsIgnoreCase":
                const expectedValue = rule.value;
                expect(actualValue.toLowerCase(), `Expected to equal '${expectedValue}' ignoring case, but got '${actualValue}'`).to.equal(expectedValue.toLowerCase());
                break;
            // 添加更多规则类型的处理逻辑
            default:
                throw new Error(`Unhandled rule type: ${rule.type}`);
        }
    });
}

function getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key] !== undefined ? current[key] : undefined, obj);
}