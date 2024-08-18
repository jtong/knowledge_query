const fs = require('fs');
const path = require('path');
const generateContext = require('./generator/project_context_generator');

function handleKnowledgeSpaceOperation(dsl, knowledgeSpace) {
  switch (dsl.action) {
    case 'GET':
      return queryKnowledgeSpace(dsl, knowledgeSpace);
    case 'CREATE':
      return createKnowledgeItem(dsl, knowledgeSpace);
    default:
      throw new Error('Invalid action. Only "GET" and "CREATE" are supported.');
  }
}

function queryKnowledgeSpace(dsl, knowledgeSpace) {
  // 保持原有的 GET 逻辑不变
  if (dsl.target !== 'knowledge_item') {
    throw new Error('Invalid target. Only "knowledge_item" is supported.');
  }

  let results = knowledgeSpace.knowledge_space.knowledge_items;

  // 应用条件过滤
  if (dsl.conditions && dsl.conditions.length > 0) {
    results = results.filter(item => {
      return dsl.conditions.every(condition => {
        switch (condition.operator) {
          case '=':
            return item[condition.field] === condition.value;
          case '!=':
            return item[condition.field] !== condition.value;
          case 'CONTAINS':
            return item[condition.field].includes(condition.value);
          case 'STARTS_WITH':
            return item[condition.field].startsWith(condition.value);
          default:
            return true;
        }
      });
    });
  }

  // 应用排序
  if (dsl.order_by) {
    results.sort((a, b) => {
      if (a[dsl.order_by.field] < b[dsl.order_by.field]) return dsl.order_by.direction === 'ASC' ? -1 : 1;
      if (a[dsl.order_by.field] > b[dsl.order_by.field]) return dsl.order_by.direction === 'ASC' ? 1 : -1;
      return 0;
    });
  }

  // 应用分页
  if (dsl.offset) {
    results = results.slice(dsl.offset);
  }
  if (dsl.limit) {
    results = results.slice(0, dsl.limit);
  }

  return results;
}

function createKnowledgeItem(dsl, knowledgeSpace) {
  if (dsl.target !== 'knowledge_item') {
    throw new Error('Invalid target. Only "knowledge_item" is supported for creation.');
  }

  if (dsl.type !== 'project_context') {
    throw new Error('Invalid type. Only "project_context" is supported for creation.');
  }

  const configPath = dsl.config_path;
  if (!configPath) {
    throw new Error('Config path is required for creating project_context.');
  }

  // Read and parse the config file
  const configContent = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configContent);

  // Modify the base_path to be absolute
  config.project.base_path = path.resolve(path.dirname(configPath), config.project.base_path);

  // Generate the context
  const context = generateContext(config);

  // Create the new knowledge item
  const newItem = {
    id: knowledgeSpace.knowledge_space.knowledge_items.length + 1,
    type: 'project_context',
    content: context,
    created_at: new Date().toISOString()
  };

  // Add the new item to the knowledge space
  knowledgeSpace.knowledge_space.knowledge_items.push(newItem);

  return newItem;
}

module.exports = { handleKnowledgeSpaceOperation };