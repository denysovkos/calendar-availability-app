import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets';
import {StackConfig} from "./rds-stack";
import {Construct} from "constructs";

export class DockerImageDeploymentStack extends cdk.Stack {
    public imageTag: string;
    public image: ecrAssets.DockerImageAsset;

    constructor(
        scope: Construct,
        id: string,
        props: StackConfig & { repository: ecr.Repository }
    ) {
        super(scope, id, props);

        // Create the Docker image asset with a specific asset ID
        this.image = new ecrAssets.DockerImageAsset(this, `${id}-docker-image`, {
            directory: process.cwd(),
            platform: ecrAssets.Platform.LINUX_AMD64,
            buildArgs: {
                GITHUB_PACKAGE_TOKEN: process.env.GITHUB_PACKAGE_TOKEN || "",
                PORT: "8080",
            },
            invalidation: {
                buildArgs: false,
            },
            assetName: `${id}-docker-image-${+new Date()}`,
            exclude: ['cdk.out', 'node_modules'],
            cacheDisabled: true
        });
        this.image.repository.grantPullPush(new cdk.aws_iam.AccountRootPrincipal());
        this.image.repository.grantPullPush(new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'));

        this.imageTag = this.image.imageTag;

        // TODO: Find a way to deploy the image to another ECR repository
        // Task: https://atlasmetrics.atlassian.net/browse/MVRX-1272

        // Add more detailed outputs
        new cdk.CfnOutput(this, 'EcrUri', {
            value: props.repository.repositoryUri,
            description: 'ECR Repository URI'
        });

        new cdk.CfnOutput(this, 'ImageUri', {
            value: this.image.imageUri,
            description: 'Full Image URI with tag'
        });

        new cdk.CfnOutput(this, 'ImageTag', {
            value: this.imageTag,
            description: 'Image Tag'
        });
    }
}