import Fastify, {FastifyInstance} from 'fastify'
import cors from "@fastify/cors";
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {swaggerOptions, swaggerUiOptions} from './swagger-tools/swagger-config';
import {healthCheckSchema} from "../../presentation/openapi/schemas";

export class HttpServer {
    private readonly server: FastifyInstance
    private readonly port = +(process.env.PORT || 8080);
    private swaggerEnabled = false;

    constructor() {
        this.server = Fastify({
            logger: true
        })
    }

    setCors(): HttpServer {
        this.server.register(cors);

        return this;
    }

    setHealthcheck(): HttpServer {
        this.server.get("/", {
            schema: {
                tags: ['health'],
                ...healthCheckSchema
            }
        }, async () => {
            return {
                health: "alive",
            };
        });

        return this;
    }

    async withSwagger(): Promise<void> {
        this.swaggerEnabled = true;

        await this.server.register(swagger, swaggerOptions);
        await this.server.register(swaggerUi, swaggerUiOptions);
    }

    async run(): Promise<void> {
        if (this.swaggerEnabled) {
            await this.server.ready();
            this.server.swagger();
        }

        this.server.listen({host: "0.0.0.0", port: this.port}, (err, address) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }

            console.log(`Server listening at ${address}`);
            if (this.swaggerEnabled) {
                console.log(`Swagger documentation available at ${address}/api/docs`);
            }
        });
    }
}