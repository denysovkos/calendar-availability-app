import "reflect-metadata";
import {GraphQLServer} from "./infrastructure/graphql/server";
// import {HttpServer} from "./infrastructure/http/server";

export const sum = (a: number, b: number): number => a + b;

// Example of HTTP server
// Promise.resolve()
//     .then(async () => {
//         // Create server instance
//         const server = new HttpServer()
//         // Set cors/middlewares
//         server.setCors()
//         // Enable swagger when needed
//         await server.withSwagger()
//         // Set routes
//         server.setHealthcheck()
//         // Run then server
//         await server.run()
//     })

// Example of Graphql server
Promise.resolve()
    .then(async () => {
        // Create server instance
        const gqlServer = new GraphQLServer().setCors().setHealthcheck();
        // Set Apollo Server
        const server = await gqlServer.setApolloServer()
        await server.run()
    })