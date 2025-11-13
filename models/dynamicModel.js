const mongoose = require('mongoose');

const createDynamicModel = (testName, fields) => {
    const schemaDefinition = {};

    fields.forEach(field => {
        schemaDefinition[field.fieldName] = {
            fieldName: {
                type: String,
                default: field.fieldName
            },
            value: {
                type: getType(field.fieldType),
                default: field.defaultValue || undefined,
            },
            unit: {
                type: String,
                default: field.unit || null
            },
            range: {
                type: String,
                default: field.range || null
            }
        };

    });

    const schema = new mongoose.Schema(schemaDefinition);
    return mongoose.model(testName, schema);
};

const getType = (type) => {
    if (!type || typeof type !== 'string') return mongoose.Schema.Types.Mixed;
    switch (type.toLowerCase()) {
        case 'string': return String;
        case 'number': return Number;
        case 'date': return Date;
        case 'boolean': return Boolean;
        default: return mongoose.Schema.Types.Mixed;
    }
};

module.exports = createDynamicModel;
