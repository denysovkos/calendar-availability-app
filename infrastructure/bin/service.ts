#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
// @ts-ignore
import {EcrStack} from "../lib/stacks/ecr-stack";
// @ts-ignore
import {DatabaseConfig, RdsStack} from "../lib/stacks/rds-stack";
// @ts-ignore
import {DynamoStack} from "../lib/stacks/dynamo-stack";
// @ts-ignore
import {DomainStack} from "../lib/stacks/domain-stack";
// @ts-ignore
import {GraphqlStack} from "../lib/stacks/grahql-stack";
// @ts-ignore
import {generateResourceName, getGitRepositoryName} from "../shared/helpers";
import {DeployProps, isFeatureEnvironment} from "@atlas-metrics/utils-cdk";
// @ts-ignore
import {VpcStack} from "../lib/stacks/vpc-stack";
// @ts-ignore
import {DockerImageDeploymentStack} from "../lib/stacks/docker-image-deployment-stack";
// @ts-ignore
import {EcsContainerStack} from "../lib/stacks/ecs-container-stack";
// @ts-ignore
import {config} from "./config";

export interface StackConfig extends DeployProps {
    serviceName: string;
    databases: DatabaseConfig;
    domain?: string;
    graphql: boolean;
    vpc?: ec2.Vpc;
}

const app = new cdk.App();

// 0. Create VPC
const vpcStack = new VpcStack(app, generateResourceName(config.serviceName, config.env.stage, 'vpc'), config);
config.vpc = vpcStack.vpc;

// 1. Create ECR Repository
const ecrStack = new EcrStack(app, generateResourceName(config.serviceName, config.env.stage, 'ecr'), config);

// 2. Create Databases (if enabled)
const rdsStack = config.databases.postgres ?
    new RdsStack(app, generateResourceName(config.serviceName, config.env.stage, 'rds'), config) : undefined;

const dynamoStack = config.databases.dynamo ?
    new DynamoStack(app, generateResourceName(config.serviceName, config.env.stage, 'dynamodb'), config) : undefined;

// 3. Build and push Docker image
const dockerImageStack = new DockerImageDeploymentStack(app, generateResourceName(config.serviceName, config.env.stage, 'docker-image'), {
    ...config,
    repository: ecrStack.repository,
});

// 4. Create Service (depends on all previous stacks)
const serviceStack = new EcsContainerStack(app, generateResourceName(config.serviceName, config.env.stage, 'ecs-service'), {
    ...config,
    repository: ecrStack.repository,
    imageTag: dockerImageStack.imageTag,
    dockerImageAsset: dockerImageStack.image,
    rdsStack,
    dynamoStack,
});

// 5. Add GraphQL layer on top of the service (if enabled)
const graphqlStack = config.graphql ?
    new GraphqlStack(app, generateResourceName(config.serviceName, config.env.stage, 'graphql'), serviceStack.service, config) : undefined;

// Set up dependencies
ecrStack.addDependency(vpcStack);
serviceStack.addDependency(ecrStack);

if (rdsStack) serviceStack.addDependency(rdsStack);
if (dynamoStack) serviceStack.addDependency(dynamoStack);
if (graphqlStack) graphqlStack.addDependency(serviceStack);

dockerImageStack.addDependency(ecrStack);
serviceStack.addDependency(dockerImageStack);
