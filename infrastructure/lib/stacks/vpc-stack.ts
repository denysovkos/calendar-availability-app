import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import {DeployProps} from "@atlas-metrics/utils-cdk";

interface StackConfig extends DeployProps {
    serviceName: string;
}

export class VpcStack extends cdk.Stack {
    public readonly vpc: ec2.Vpc;

    constructor(
        scope: cdk.App,
        id: string,
        props: StackConfig
    ) {
        super(scope, id, props);

        const cwLogs = new logs.LogGroup(this, `${id}-logs`, {
            logGroupName: `/atlas-metrics/logs/${props.serviceName}`,
        });

        // VPC
        // Will be better to share VPC through all services
        this.vpc = new ec2.Vpc(
            this,
            `${id}-vpc`,
            {
                maxAzs: 2,
                // natGateways: 1, // [ONLY WHEN NEEDED!!] Uncomment to create NAT Gateway with Elastic IP
                flowLogs: {
                    's3': {
                        destination: ec2.FlowLogDestination.toCloudWatchLogs(cwLogs),
                        trafficType: ec2.FlowLogTrafficType.ALL,
                    }
                }
            }
        );

        new cdk.CfnOutput(this, "Logs group", {
            value: cwLogs.logGroupName,
            description: "Log group name for service",
        });
        new cdk.CfnOutput(this, "VPC", {
            value: this.vpc.vpcArn,
            description: "VPC ARN",
        });
    }
}
