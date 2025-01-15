import "reflect-metadata";
import {HttpServer} from "./infrastructure/http/server";
import {initDatabase} from "./infrastructure/database/dataSource";

console.log(process.env);

Promise.resolve()
    .then(initDatabase)
    .then(async () => {
        // Create server instance
        const server = new HttpServer();
        // Set cors/middlewares
        server.setCors();
        // Enable swagger when needed
        await server.withSwagger();
        // Set routes
        server.setHealthcheck().setRoutes();
        // Run then server
        await server.run();
    });