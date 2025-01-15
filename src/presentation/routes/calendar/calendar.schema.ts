import {FastifySchema} from 'fastify';

export const getCalendarAvailabilitySchema: FastifySchema = {
    body: {
        type: 'object',
        required: ['date', 'products', 'language', 'rating'],
        properties: {
            date: {
                type: 'string',
                format: 'date'
            },
            products: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: ['SolarPanels', 'Heatpumps']
                },
                minItems: 1
            },
            language: {
                type: 'string',
                enum: ['German', 'English']
            },
            rating: {
                type: 'string',
                enum: ['Gold', 'Silver', 'Bronze']
            }
        },
        additionalProperties: false
    },
    response: {
        200: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    start_date: {type: 'string'},
                    available_count: {type: 'number'}
                },
                required: ['start_date', 'available_count']
            }
        }
    }
};