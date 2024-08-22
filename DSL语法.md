## Knowledge Query DSL 介绍

Knowledge Query DSL 是一个专门设计用于查询和管理知识空间的领域特定语言。它提供了一种结构化的方式来执行各种操作，如获取、创建和批量查询知识项。

## 主要特性

1. **查询操作**：支持从知识空间中检索特定的知识项。
2. **创建操作**：允许向知识空间添加新的知识项。
3. **批量查询**：支持在单个请求中执行多个查询操作。
4. **灵活的过滤条件**：提供多种条件操作符来精确定位所需的知识项。
5. **排序和分页**：支持结果排序和限制返回的项目数量。
6. **别名**：允许为查询结果指定自定义名称。查询出的对象会以别名为key存入一个dict

## 查询操作语法

查询操作用于从知识空间中检索知识项。

### 基本查询结构

```json
{
  "action": "GET",
  "target": "knowledge_item",
  "alias": "string",
  "conditions": [
    {
      "field": "string",
      "operator": "=" | "!=" | "CONTAINS" | "STARTS_WITH",
      "value": "any"
    }
  ],
  "limit": number,
  "order_by": {
    "field": "string",
    "direction": "ASC" | "DESC"
  }
}
```

### 字段说明

- `action`: 必须为 "GET"。
- `target`: 当前仅支持 "knowledge_item"。
- `alias`: 为查询结果指定一个别名。
- `conditions`: 一个条件数组，用于过滤知识项。
- `limit`: 限制返回的结果数量。
- `order_by`: 指定结果的排序方式。

### 返回值说明

查询操作的返回值格式取决于查询结果的数量和是否指定了别名：

1. 当查询返回多个结果时，根据指定的 `alias`，返回格式为 `{ "alias": [结果数组] }`
2. 当查询只返回一个结果时，根据指定的 `alias`，返回格式为 `{ "alias": 单个结果对象 }`

### 查询示例及返回值

1. 返回多个结果的查询：

```json
{
  "action": "GET",
  "target": "knowledge_item",
  "alias": "math_courses",
  "conditions": [
    {
      "field": "type",
      "operator": "=",
      "value": "course"
    },
    {
      "field": "content",
      "operator": "CONTAINS",
      "value": "数学"
    }
  ],
  "limit": 2,
  "order_by": {
    "field": "content",
    "direction": "ASC"
  }
}
```

可能的返回值：

```json
{
  "math_courses": [
    { "id": 1, "type": "course", "content": "数学基础", "difficulty": "easy" },
    { "id": 2, "type": "course", "content": "高等数学", "difficulty": "hard" }
  ]
}
```

2. 返回单个结果的查询：

```json
{
  "action": "GET",
  "target": "knowledge_item",
  "alias": "single_math_course",
  "conditions": [
    {
      "field": "type",
      "operator": "=",
      "value": "course"
    },
    {
      "field": "content",
      "operator": "CONTAINS",
      "value": "数学"
    }
  ],
  "limit": 1,
  "order_by": {
    "field": "content",
    "direction": "ASC"
  }
}
```

可能的返回值：

```json
{
  "single_math_course": { "id": 1, "type": "course", "content": "数学基础", "difficulty": "easy" }
}
```

## 批量查询

DSL 支持批量查询，允许在一个请求中执行多个查询操作：

```json
{
  "batch": true,
  "action": "GET",
  "queries": [
    {
      // 查询 1
    },
    {
      // 查询 2
    }
  ]
}
```

### 字段说明

- `batch`: 必须设置为 `true`，表示这是一个批量查询。
- `action`: 必须为 "GET"。批量查询目前只支持获取操作。
- `queries`: 一个数组，包含多个独立的查询对象。


### 注意事项

1. 每个查询都必须指定一个唯一的 `alias`，以便在返回结果中区分不同查询的结果。
2. 批量查询中的每个独立查询都会被单独执行，它们之间没有依赖关系。


### 返回值说明

批量查询的返回值是一个对象，其中每个查询的结果都以其指定的别名为键：

```json
{
  "alias1": [结果数组或单个对象],
  "alias2": {结果数组或单个对象},
  // ... 更多结果
}
```

- 如果某个查询返回多个结果，对应的值将是一个数组。
- 如果某个查询只返回一个结果（例如，设置了 `limit: 1`），对应的值将是一个单独的对象。

### 使用示例

```json
{
  "batch": true,
  "action": "GET",
  "queries": [
    {
      "target": "knowledge_item",
      "alias": "math_courses",
      "conditions": [
        {
          "field": "type",
          "operator": "=",
          "value": "course"
        },
        {
          "field": "content",
          "operator": "CONTAINS",
          "value": "数学"
        }
      ],
      "limit": 1
    },
    {
      "target": "knowledge_item",
      "alias": "easy_courses",
      "conditions": [
        {
          "field": "type",
          "operator": "=",
          "value": "course"
        },
        {
          "field": "difficulty",
          "operator": "=",
          "value": "easy"
        }
      ],
      "limit": 1
    }
  ]
}
```

## 创建知识项操作语法

创建操作用于向知识空间添加新的知识项。

### 基本创建结构

```json
{
  "action": "CREATE",
  "target": "knowledge_item",
  "type": "string",
  "value": "any" | {
    "processor": "string",
    "meta": {
      // 处理器特定的元数据
    }
  }
}
```

### 字段说明

- `action`: 必须为 "CREATE"。
- `target`: 当前仅支持 "knowledge_item"。
- `type`: 指定创建的知识项类型。
- `value`: 可以是直接的值，或者是包含处理器信息的对象。

### 创建方式

DSL 支持两种方式创建知识项：

#### 直接提供值：

```json
{
  "action": "CREATE",
  "target": "knowledge_item",
  "type": "string",
  "value": "This is a direct string value."
}
```

#### 使用处理器（如 `prompt_context_builder`）：

```json
{
  "action": "CREATE",
  "target": "knowledge_item",
  "type": "project_context",
  "processor": "prompt_context_builder",
  "meta": {
    "config_path": "path/to/config.json"
  }
}
```

## 处理器详解

在创建知识项时，我们可以使用 processor（处理器）来执行更复杂的创建逻辑。meta 字段则用于为这个处理器提供必要的配置信息。

### Processor（处理器）

Processor 是一个指定的处理模块或函数，用于在创建知识项时执行特定的逻辑或转换。它允许我们在简单地插入一个值之外执行更复杂的操作。

目前，DSL 支持的处理器是 `prompt_context_builder`。这个处理器的主要功能是：

1. 解析项目结构
2. 读取指定的文件内容
3. 生成项目上下文

使用处理器的主要优势是可以跟外部的各种数据源集成，一旦创建，就是静态数据。知识空间的数据在会话进行过程中是不会改变的。

### Meta（元数据）

Meta 字段用于为处理器提供所需的配置信息或参数。它是一个键值对的集合，其内容取决于所使用的处理器。

对于 `prompt_context_builder` 处理器，meta 中的关键字段是 `config_path`，它指定了配置文件的路径。这个配置文件通常包含：

1. 项目的基础路径
2. 需要忽略的文件或文件夹
3. 需要包含的文件模式
4. 其他处理器特定的设置

### 示例

这里是一个使用 `prompt_context_builder` 处理器创建知识项的例子：

```json
{
  "action": "CREATE",
  "target": "knowledge_item",
  "type": "project_context",
  "processor": "prompt_context_builder",
  "meta": {
    "config_path": "test/cases/2/config.json"
  }
}
```

在这个例子中：

- `processor` 字段指定使用 `prompt_context_builder` 处理器。
- `meta` 字段提供了一个 `config_path`，指向处理器所需的配置文件。

### 配置文件示例

`config.json` 文件可能看起来像这样：

```json
{
  "project": {
    "base_path": "./",
    "ignore": {
      "path": ["node_modules", ".git"],
      "file": [".DS_Store"]
    }
  }
}
```

这个配置文件告诉 `prompt_context_builder` 处理器：

1. 项目的根目录在当前目录 (`./`)
2. 忽略路径匹配 `node_modules` 和 `.git` 的文件夹或文件
3. 忽略所有的 `.DS_Store` 文件

### 处理过程

当使用这个配置创建知识项时，`prompt_context_builder` 处理器会：

1. 读取指定的配置文件
2. 扫描项目结构，忽略指定的文件和文件夹
3. 可能会读取某些文件的内容（取决于具体实现）
4. 生成一个描述项目结构和内容的上下文
5. 将这个生成的上下文作为新知识项的内容

