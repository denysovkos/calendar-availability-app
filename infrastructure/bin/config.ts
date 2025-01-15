// @ts-ignore
import {StackConfig} from "./service";
import {isFeatureEnvironment} from "@atlas-metrics/utils-cdk";
import {getGitRepositoryName} from "../shared/helpers";

const stage = process.env.STAGE;
if (!stage || !stage.length) {
    throw new Error("deploy environment is undefined or null");
}
const SERVICE_NAME = getGitRepositoryName();
if (!SERVICE_NAME) {
    throw new Error("⚠️  Please set the SERVICE_NAME variable in the service.ts file and check your .git folder  ⚠️");
}

export const config: StackConfig = {
    graphql: false, // Set to true when you need to enable GraphQL
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
        stage,
        isFeature: isFeatureEnvironment(stage),
    },
    serviceName: SERVICE_NAME,
    databases: {
        postgres: false, // Make true when you need to enable Postgres
        dynamo: false // Make true when you need to enable DynamoDB
    },
    domain: '',  // Optional (used as {domain}.{hostedZoneName}, e.g. domain.atlas-metrics.com)
    vpc: undefined
};