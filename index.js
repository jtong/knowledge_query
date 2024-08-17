function queryKnowledgeSpace(dsl, knowledgeSpace) {
    // 确保DSL查询的目标是knowledge_item
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
            // 可以根据需要添加更多操作符
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
  
//   // 使用示例
//   const dslQuery = {
//     "action": "GET",
//     "target": "knowledge_item",
//     "conditions": [
//       {
//         "field": "type",
//         "operator": "=",
//         "value": "course"
//       },
//       {
//         "field": "content",
//         "operator": "CONTAINS",
//         "value": "数学"
//       }
//     ],
//     "limit": 5,
//     "order_by": {
//       "field": "content",
//       "direction": "ASC"
//     }
//   };
  
//   const results = queryKnowledgeSpace(dslQuery, knowledgeSpace);
//   console.log(results);

module.exports = {queryKnowledgeSpace}