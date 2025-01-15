import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import {DeployProps, isProdEnv} from "@atlas-metrics/utils-cdk";
// @ts-ignore
import {DatabaseConfig, RdsStack} from "./stacks/rds-stack";
// @ts-ignore
import {DynamoStack} from "./stacks/dynamo-stack";
import {Construct} from "constructs";
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import {ApplicationProtocol, ListenerCertificate} from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export interface StackConfig extends DeployProps {
    serviceName: string;
    databases: DatabaseConfig;
    domain?: string;
    graphql: boolean;
    vpc?: ec2.Vpc;
}

export class EcsContainerStack extends cdk.Stack {
    public readonly service: ecsPatterns.ApplicationLoadBalancedFargateService;

    constructor(
        scope: Construct,
        id: string,
        props: StackConfig & {
            repository: ecr.Repository;
            imageTag: string;
            dockerImageAsset: ecrAssets.DockerImageAsset;
            rdsStack?: RdsStack;
            dynamoStack?: DynamoStack;
        }
    ) {
        super(scope, id, props);

        const cluster = new ecs.Cluster(this, `${id}-ecs-cluster`, {
            vpc: props.vpc,
        });

        // Prepare environment variables based on enabled databases
        const environment: { [key: string]: string } = {};
        const secrets: { [key: string]: ecs.Secret } = {};

        if (props.rdsStack && props.databases.postgres) {
            environment.DB_HOST = props.rdsStack.database.dbInstance.instanceEndpoint.hostname;
            environment.DB_PORT = props.rdsStack.database.dbInstance.instanceEndpoint.port.toString();
            environment.DB_DATABASE = props.serviceName;
            environment.DB_USER = props.rdsStack.database.dbCredentialsSecret.user;
            secrets.DB_PASSWORD = ecs.Secret.fromSecretsManager(props.rdsStack.database.dbCredentialsSecret.password);
        }

        if (props.dynamoStack && props.databases.dynamo) {
            environment.DYNAMODB_TABLE = props.dynamoStack.table.tableName;
        }

        const domainConfig: { [key: string]: unknown } = {
            assignPublicIp: true,
        }

        const certificateArn = StringParameter.valueForStringParameter(
            this,
            "/atlas-metrics/eu-central-1/tls-certificate-arn"
        );
        const certificate = Certificate.fromCertificateArn(this, "Certificate", certificateArn);
        if (props.domain) {
            // Load Hosted Zone and Certificate
            const hostedZoneName = StringParameter.valueForStringParameter(this, "/atlas-metrics/global/hosted-zone");
            const zone = HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
                hostedZoneId: StringParameter.valueForStringParameter(this, "/atlas-metrics/global/hosted-zone/id"),
                zoneName: hostedZoneName,
            });

            domainConfig.domainName = `${props.domain}.${hostedZoneName}`;
            domainConfig.domainZone = zone;
            domainConfig.certificate = certificate;
        }

        // Create the load-balanced Fargate service
        this.service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, `${id}-ecs-service`, {
            cluster,
            memoryLimitMiB: 1024,
            cpu: 512,
            taskImageOptions: {
                image: ecs.ContainerImage.fromDockerImageAsset(props.dockerImageAsset),
                containerPort: 8080,
                environment: {
                    ...environment,
                    NODE_ENV: 'production',
                },
                secrets,
            },
            desiredCount: 1,
            // Domain configuration
            ...domainConfig,
            // LB Configuration
            publicLoadBalancer: true,
            listenerPort: 80
        });

        // Add HTTPS listener
        this.service.loadBalancer.addListener('HttpsListener', {
            port: 443,
            protocol: ApplicationProtocol.HTTPS,
            certificates: [ListenerCertificate.fromArn(certificate.certificateArn)],
            defaultTargetGroups: [this.service.targetGroup],
        });

        this.service.service.autoScaleTaskCount({
            minCapacity: 1,
            maxCapacity: 3,
        }).scaleOnCpuUtilization(`${id}-cpu-scaling`, {
            targetUtilizationPercent: 50,
        });

        if (isProdEnv(props.env.stage)) {
            // ECS CPU Utilization Alarm
            new cloudwatch.Alarm(this, "EcsCpuUtilizationAlarm", {
                alarmDescription: "Alarm if ECS CPU utilization is high",
                metric: this.service.service.metricCpuUtilization(),
                threshold: 80, // Set threshold as per requirements
                evaluationPeriods: 1,
                actionsEnabled: true,
            });

            // ECS Memory Utilization Alarm
            new cloudwatch.Alarm(this, "EcsMemoryUtilizationAlarm", {
                alarmDescription: "Alarm if ECS memory utilization is high",
                metric: this.service.service.metricMemoryUtilization(),
                threshold: 80,
                evaluationPeriods: 1,
                actionsEnabled: true,
            });

            // Load Balancer Latency Alarm
            new cloudwatch.Alarm(this, "LoadBalancerLatencyAlarm", {
                alarmDescription: "Alarm if Load Balancer latency is high",
                metric: this.service.loadBalancer!.metricTargetResponseTime(),
                threshold: 1, // Adjust threshold as needed, e.g., 1 second
                evaluationPeriods: 1,
                actionsEnabled: true,
            });
        }

        // Output the load balancer DNS
        new cdk.CfnOutput(this, 'LoadBalancerDNS', {
            value: this.service.loadBalancer.loadBalancerDnsName,
            description: 'Load balancer DNS name',
        });

        if (props.domain) {
            new cdk.CfnOutput(this, 'ServiceURL', {
                value: `${domainConfig.domainName}`,
                description: 'Service URL',
            });
        }
    }
}
