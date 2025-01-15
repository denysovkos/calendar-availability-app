import Fastify, {FastifyInstance} from 'fastify';
import {ApolloServer} from '@apollo/server';
import {fastifyApolloDrainPlugin, fastifyApolloHandler} from '@as-integrations/fastify';
import cors from "@fastify/cors";
import {buildGraphqlSchema} from "../../presentation/resolvers";

export class GraphQLServer {
    private readonly server: FastifyInstance;
    private readonly port = +(process.env.PORT || 8080);
    private apolloServer: ApolloServer | null = null;

    constructor() {
        this.server = Fastify({
            logger: true
        });
    }

    setCors(): GraphQLServer {
        this.server.register(cors);
        return this;
    }

    setHealthcheck(): GraphQLServer {
        this.server.get("/", async () => {
            return {
                health: "alive",
            };
        });

        return this;
    }

    async setApolloServer(): Promise<GraphQLServer> {
        const schema = await buildGraphqlSchema();

        this.apolloServer = new ApolloServer({
            schema,
            plugins: [fastifyApolloDrainPlugin(this.server)],
            logger: this.server.log,
        });

        await this.apolloServer.start();

        this.server.route({
            url: '/graphql',
            method: ['POST', 'GET'],
            handler: fastifyApolloHandler(this.apolloServer, {
                context: async (request, reply) => {
                    return {request, reply};
                }
            })
        });

        return this;
    }

    async run(): Promise<void> {
        if (!this.apolloServer) {
            throw new Error('Apollo Server must be initialized before running the server');
        }

        try {
            const address = await this.server.listen({
                host: "0.0.0.0",
                port: this.port
            });

            console.log(`Server listening at ${address}`);
            console.log(`GraphQL endpoint available at ${address}/graphql`);
        } catch (err) {
            this.server.log.error(err);
            await this.apolloServer.stop();
            process.exit(1);
        }
    }
}