import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import {DeployProps, isProdEnv} from "@atlas-metrics/utils-cdk";

export interface DatabaseConfig {
    postgres?: boolean;
    dynamo?: boolean;
}

export interface StackConfig extends DeployProps {
    serviceName: string;
    databases: DatabaseConfig;
    domain?: string;
    vpc?: ec2.Vpc;
}

export interface IDatabase {
    dbInstance: rds.DatabaseInstance;
    dbCredentialsSecret?: {
        user: string;
        password: secretsmanager.Secret;
    };
}

export class RdsStack extends cdk.Stack {
    public readonly database: IDatabase;
    public readonly dbSecurityGroup: ec2.SecurityGroup;

    constructor(scope: cdk.App, id: string, props: StackConfig) {
        super(scope, id, props);

        if (!props.vpc) {
            throw new Error('RDS: VPC is required');
        }

        const ssmRole = new iam.Role(this, `${id}-ssm-role`, {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
            ],
        });
        new cdk.CfnOutput(this, "SSM Role", {
            value: ssmRole.roleArn,
        });

        const bastionSecurityGroup = new ec2.SecurityGroup(this, `${id}-bastion-sg`, {
            vpc: props.vpc,
            description: 'Security group for bastion host',
            allowAllOutbound: true,
        });

        const bastion = new ec2.Instance(this, `${id}-bastion`, {
            vpc: props.vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
            machineImage: ec2.MachineImage.latestAmazonLinux2(),
            vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
            role: ssmRole,
            securityGroup: bastionSecurityGroup,
        });
        new cdk.CfnOutput(this, "Bastion for service", {
            value: bastion.instanceId,
            description: "Bastion instance id",
        });

        const databasePassword = new secretsmanager.Secret(this, `${id}-rds-password`, {
            secretName: `${id}-secrets-rds-password`,
            generateSecretString: {
                excludeCharacters: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
                excludePunctuation: true,
                requireEachIncludedType: true,
                includeSpace: false,
                passwordLength: 16
            }
        });

        this.dbSecurityGroup = new ec2.SecurityGroup(this, `${id}-rds-sg`, {
            vpc: props.vpc,
            description: `Security group for RDS: ${id}`,
        });

        this.dbSecurityGroup.addIngressRule(
            bastionSecurityGroup,
            ec2.Port.tcp(5432),
            `Allow connections from bastion to RDS: ${id}`
        );

        const dbInstance = new rds.DatabaseInstance(this, `${id}-postgres`, {
            engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_17_2 }),
            vpc: props.vpc,
            credentials: rds.Credentials.fromPassword(
                "postgres",
                databasePassword.secretValue
            ),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            storageEncrypted: true,
            allocatedStorage: 20,
            backupRetention: cdk.Duration.days(30),
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups: [this.dbSecurityGroup],
            publiclyAccessible: false,
        });

        new cdk.CfnOutput(this, "Postgres DB Instance", {
            value: dbInstance.instanceIdentifier,
            description: "Postgres DB Instance id",
        });

        this.database = {
            dbInstance,
            dbCredentialsSecret: {
                user: "postgres",
                password: databasePassword,
            },
        };

        if (isProdEnv(props.env.stage)) {
            // EC2 Bastion CPU Utilization Alarm
            new cloudwatch.Alarm(this, "BastionCpuUtilizationAlarm", {
                alarmDescription: "Alarm if CPU Utilization exceeds 70%",
                metric: new cloudwatch.Metric({
                    namespace: "AWS/EC2",
                    metricName: "CPUUtilization",
                    dimensionsMap: {
                        InstanceId: bastion.instanceId,
                    },
                    statistic: "Average",
                    period: cdk.Duration.minutes(5),
                }),
                threshold: 70, // Set the CPU threshold percentage
                evaluationPeriods: 1, // Number of consecutive periods the condition must be met
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            });

            // RDS CPU Utilization Alarm
            new cloudwatch.Alarm(this, "RdsCpuUtilizationAlarm", {
                alarmDescription: "Alarm if RDS CPU utilization is high",
                metric: this.database.dbInstance.metric("CPUUtilization"),
                threshold: 80,
                evaluationPeriods: 1,
                actionsEnabled: true,
            });

            // RDS IO Utilization Alarm
            new cloudwatch.Alarm(this, "RdsIoUtilizationAlarm", {
                alarmDescription: "Alarm if RDS IO utilization is high",
                metric: this.database.dbInstance.metric("DiskQueueDepth"),
                threshold: 5,
                evaluationPeriods: 1,
                actionsEnabled: true,
            });

            // RDS Free Storage Space Alarm
            new cloudwatch.Alarm(this, "RdsFreeStorageSpaceAlarm", {
                alarmDescription: "Alarm if RDS free storage space is low",
                metric: this.database.dbInstance.metric("FreeStorageSpace"),
                threshold: 5 * 1024 * 1024 * 1024, // 5 GB in bytes
                evaluationPeriods: 1,
                actionsEnabled: true,
            });

            // RDS Freeable Memory Alarm
            new cloudwatch.Alarm(this, "RdsFreeableMemoryAlarm", {
                alarmDescription: "Alarm if RDS freeable memory is low",
                metric: this.database.dbInstance.metric("FreeableMemory"),
                threshold: 500 * 1024 * 1024, // 500 MB in bytes
                evaluationPeriods: 1,
                actionsEnabled: true,
            });
        }
    }
}