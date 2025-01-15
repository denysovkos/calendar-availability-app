import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class EcrStack extends cdk.Stack {
    public readonly repository: ecr.Repository;

    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.repository = new ecr.Repository(this, `${id}-ecr-repository`, {
            repositoryName: `${id}-ecr-repository`,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            // Add image scanning
            imageScanOnPush: true,
            // Add lifecycle rules to manage images
            lifecycleRules: [
                {
                    maxImageCount: 10,
                    rulePriority: 1,
                    description: 'Keep only the last 10 images',
                },
            ],
        });

        // Add explicit permissions if needed
        this.repository.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
            actions: [
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'ecr:BatchCheckLayerAvailability',
                'ecr:PutImage',
                'ecr:InitiateLayerUpload',
                'ecr:UploadLayerPart',
                'ecr:CompleteLayerUpload',
            ],
            principals: [new cdk.aws_iam.AccountRootPrincipal()],
        }));
        this.repository.grantPullPush(new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'));

        new cdk.CfnOutput(this, 'EcrUri', {
            value: this.repository.repositoryUri,
            description: 'ECR Repository URI'
        });
    }
}