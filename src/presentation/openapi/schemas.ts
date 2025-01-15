export const healthCheckSchema = {
    description: 'Health check route',
    summary: 'Returns server status',
    response: {
        200: {
            description: 'A successful response indicating the server is running',
            type: 'object',
            properties: {
                health: {type: 'string', description: 'The current health status of the server'}
            },
            example: {health: 'alive'}
        }
    }
};