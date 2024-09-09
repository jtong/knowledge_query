const fs = require('fs');
const path = require('path');
const generateContext = require('./generator/project_context_generator');

function handleKnowledgeSpaceOperation(dsl, knowledgeSpace, config = {}) {
    if (dsl.batch) {
        return handleBatchQuery(dsl, knowledgeSpace, config);
    } else {
        return handleSingleQuery(dsl, knowledgeSpace, config);
    }
}

function handleBatchQuery(dsl, knowledgeSpace, config) {
    if (dsl.action !== 'GET') {
        throw new Error('Batch queries currently only support GET actions');
    }

    const result = {};
    dsl.queries.forEach(query => {
        if (query.action && query.action !== 'GET') { //如果不写，就等于是GET
            throw new Error('Individual queries in a batch must all be GET actions');
        }
        const queryResult = queryKnowledgeSpace(query, knowledgeSpace, config);
        result[query.alias] = queryResult[query.alias];
    });
    return result;
}


function handleSingleQuery(dsl, knowledgeSpace, config) {
    switch (dsl.action) {
        case 'GET':
            return queryKnowledgeSpace(dsl, knowledgeSpace, config);
        case 'CREATE':
            return createKnowledgeItem(dsl, knowledgeSpace, config);
        case 'UPDATE':
            return updateKnowledgeItem(dsl, knowledgeSpace, config);
        default:
            throw new Error('Invalid action. Only "GET", "CREATE", and "UPDATE" are supported.');
    }
}

function queryKnowledgeSpace(dsl, knowledgeSpace, config) {
    if (dsl.target !== 'knowledge_item') {
        throw new Error('Invalid target. Only "knowledge_item" is supported.');
    }

    let results = knowledgeSpace.knowledge_space.knowledge_items.map(item => {
        if (item.content_path && config && config.repoFilePath) {
            const repoDir = path.dirname(config.repoFilePath);
            const fullPath = path.resolve(repoDir, item.content_path);
            try {
                item.content = fs.readFileSync(fullPath, 'utf8');
            } catch (error) {
                console.error(`Error reading file ${fullPath}: ${error.message}`);
                item.content = `Error: Unable to read content from ${item.content_path}`;
            }
        }
        return item;
    });

    // Apply condition filtering
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

    // Apply sorting
    if (dsl.order_by) {
        results.sort((a, b) => {
            if (a[dsl.order_by.field] < b[dsl.order_by.field]) return dsl.order_by.direction === 'ASC' ? -1 : 1;
            if (a[dsl.order_by.field] > b[dsl.order_by.field]) return dsl.order_by.direction === 'ASC' ? 1 : -1;
            return 0;
        });
    }

    // Apply pagination
    if (dsl.offset) {
        results = results.slice(dsl.offset);
    }
    if (dsl.limit) {
        results = results.slice(0, dsl.limit);
    }

    // Handle alias and return format
    if (dsl.alias) {
        if (dsl.limit === 1 || results.length === 1) {
            // If limit is 1 or only one result, return a single object
            return { [dsl.alias]: results[0] };
        } else {
            // Otherwise, return an object with the alias as key and the array as value
            return { [dsl.alias]: results };
        }
    }

    // If no alias is provided, return the results array as before
    return results;
}

function createKnowledgeItem(dsl, knowledgeSpace, config) {
    if (dsl.target !== 'knowledge_item') {
        throw new Error('Invalid target. Only "knowledge_item" is supported for creation.');
    }
    if (dsl.processor) {
        if (dsl.processor == 'prompt_context_builder') {
            const configPath = dsl.meta.config_path;
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
                type: dsl.type,
                content: context,
                created_at: new Date().toISOString()
            };

            // Add the new item to the knowledge space
            knowledgeSpace.knowledge_space.knowledge_items.push(newItem);

            return newItem;
        }
    } if (dsl.value !== undefined) {
        // Handle direct value creation
        const newItem = {
            id: knowledgeSpace.knowledge_space.knowledge_items.length + 1,
            type: dsl.type || 'string', // Default to 'string' if type is not specified
            content: dsl.value,
            created_at: new Date().toISOString()
        };

        // Add the new item to the knowledge space
        knowledgeSpace.knowledge_space.knowledge_items.push(newItem);

        return newItem;
    } else {
        throw new Error('Invalid creation method. Use either "processor" or provide a "value".');
    }

}


function updateKnowledgeItem(dsl, knowledgeSpace, config) {
    if (dsl.target !== 'knowledge_item') {
        throw new Error('Invalid target. Only "knowledge_item" is supported for updating.');
    }

    let updatedItems = 0;
    knowledgeSpace.knowledge_space.knowledge_items = knowledgeSpace.knowledge_space.knowledge_items.map(item => {
        if (matchesConditions(item, dsl.conditions)) {
            updatedItems++;
            return { ...item, ...dsl.update };
        }
        return item;
    });

    if (updatedItems === 0) {
        throw new Error('No items matched the update conditions.');
    }

    return { updatedItems, message: `${updatedItems} item(s) updated successfully.` };
}

function matchesConditions(item, conditions) {
    return conditions.every(condition => {
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
}

module.exports = { handleKnowledgeSpaceOperation };