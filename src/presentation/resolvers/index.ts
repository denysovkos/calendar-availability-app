import {buildSchema} from "type-graphql";
import {HealthResolver} from "./health/health.resolver";
import {GraphQLSchema} from "graphql/type";

export const buildGraphqlSchema = async (): Promise<GraphQLSchema> => await buildSchema({
    resolvers: [HealthResolver],
    emitSchemaFile: `${process.cwd()}/schema.graphql`,
});