const { expect } = require('chai');
const { handleKnowledgeSpaceOperation } = require('../../../index.js');

module.exports = function(result, testCase) {
    const { updateResult, knowledgeSpace } = result;
    
    // 验证更新操作结果
    expect(updateResult).to.be.an('object');
    expect(updateResult.updatedItems).to.equal(1);
    expect(updateResult.message).to.equal('1 item(s) updated successfully.');

    // 使用GET DSL查询以确保更改已应用
    const getDsl = {
        action: "GET",
        target: "knowledge_item",
        alias: "updated_item",
        conditions: [
            {
                field: "id",
                operator: "=",
                value: 1
            }
        ]
    };

    const verificationResult = handleKnowledgeSpaceOperation(getDsl, knowledgeSpace);
    const updatedItem = verificationResult.updated_item;

    // 验证查询结果
    expect(updatedItem).to.be.an('object');
    expect(updatedItem.content).to.equal('Updated math basics');
    expect(updatedItem.difficulty).to.equal('medium');

    // 验证知识空间中的项目已更新
    const updatedItemInSpace = knowledgeSpace.knowledge_space.knowledge_items.find(item => item.id === 1);
    expect(updatedItemInSpace).to.be.an('object');
    expect(updatedItemInSpace.content).to.equal('Updated math basics');
    expect(updatedItemInSpace.difficulty).to.equal('medium');
};