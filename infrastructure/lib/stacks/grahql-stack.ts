import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

export class GraphqlStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, service: ecsPatterns.ApplicationLoadBalancedFargateService, props?: cdk.StackProps) {
        super(scope, id, props);

        // AppSync API
        const api = new appsync.GraphqlApi(this, `${id}-graphql-api`, {
            name: `${id}-graphql-api`,
            definition: appsync.Definition.fromFile(`${process.cwd()}/schema.graphql`), // Path to GraphQL schema
            xrayEnabled: true,
        });

        // AppSync HTTP Data Source
        const httpDatasource = api.addHttpDataSource(
            `${id}-http-datasource`,
            service.loadBalancer.loadBalancerDnsName, // Backend Load Balancer DNS
            {
                authorizationConfig: {
                    signingRegion: cdk.Stack.of(this).region,
                    signingServiceName: "execute-api",
                },
            }
        );

        // Create Resolvers
        httpDatasource.createResolver('', {
            typeName: "Query",
            fieldName: "getUser", // Matches Query in schema.graphql
        });

        httpDatasource.createResolver('', {
            typeName: "Mutation",
            fieldName: "login", // Matches Mutation in schema.graphql
        });

        // Outputs
        new cdk.CfnOutput(this, "GraphqlApiEndpoint", {
            value: api.graphqlUrl,
        });

        new cdk.CfnOutput(this, "GraphqlApiKey", {
            value: api.apiKey || "No API Key set", // Use if you add an API Key
        });
    }
}
