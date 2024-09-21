# updateCondition 函数使用文档

## 概述

`updateCondition` 函数用于更新 DSL (领域特定语言) 查询中的条件值。它允许您通过表达式动态地替换查询条件中的变量值，同时保持原始值的类型。该函数现在支持单个查询和批量查询。

## 函数签名

```javascript
function updateCondition(dsl, updates)
```

## 参数

- `dsl` (对象): 原始的 DSL 查询对象，可以是单个查询或批量查询。
- `updates` (对象): 包含要替换的变量名和新值的对象。

## 返回值

返回一个新的 DSL 对象，其中包含更新后的条件值。

## 使用方法

1. 准备原始的 DSL 查询对象，在需要动态更新的条件中添加 `express` 属性，使用 `${变量名}` 格式表示变量。
2. 创建一个包含要更新的变量名和新值的 `updates` 对象。
3. 调用 `updateCondition` 函数，传入原始 DSL 和 updates 对象。
4. 使用返回的新 DSL 对象进行后续操作。

## 示例

### 单个查询示例

```javascript
const originalDSL = {
    action: "GET",
    target: "knowledge_item",
    conditions: [
        {
            field: "type",
            operator: "=",
            value: "course"
        },
        {
            field: "content_path",
            operator: "=",
            value: "default.txt",
            express: "${filename}"
        },
        {
            field: "year",
            operator: "=",
            value: 2000,
            express: "${year}"
        },
        {
            field: "is_active",
            operator: "=",
            value: true,
            express: "${active}"
        }
    ]
};

const updates = {
    filename: "sample_content.txt",
    year: "2023",
    active: "false"
};

const updatedDSL = updateCondition(originalDSL, updates);

console.log(JSON.stringify(updatedDSL, null, 2));
```

### 批量查询示例

```javascript
const batchDSL = {
    batch: true,
    action: "GET",
    queries: [
        {
            target: "knowledge_item",
            alias: "query1",
            conditions: [
                {
                    field: "type",
                    operator: "=",
                    value: "course",
                    express: "${courseType}"
                }
            ]
        },
        {
            target: "knowledge_item",
            alias: "query2",
            conditions: [
                {
                    field: "year",
                    operator: "=",
                    value: 2000,
                    express: "${year}"
                }
            ]
        }
    ]
};

const updates = {
    courseType: "webinar",
    year: "2023"
};

const updatedBatchDSL = updateCondition(batchDSL, updates);
console.log(JSON.stringify(updatedBatchDSL, null, 2));
```

## 注意事项

1. `updateCondition` 函数不会修改原始的 DSL 对象，而是返回一个新的对象。
2. 只有包含 `express` 属性的条件会被更新。
3. 函数会根据原始 `value` 的类型来转换更新后的值，以保持类型一致性。
4. 如果 `updates` 对象中没有提供对应的变量值，原始的 `value` 将被保留。
5. 该函数现在支持单个查询（包含 `conditions` 数组）和批量查询（包含 `queries` 数组）的 DSL 结构。
6. 对于批量查询，函数会遍历每个查询对象并更新其中的条件。

## 错误处理

如果传入的 DSL 对象既不包含 `conditions` 数组也不包含 `queries` 数组，函数将抛出一个错误。请确保您的 DSL 对象结构正确。