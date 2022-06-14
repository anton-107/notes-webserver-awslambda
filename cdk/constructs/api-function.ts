import { Stack } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface APIFunctionProps {
  method: HTTPMethod;
  path: string;
  main: string;
  depsLockFilePath: string;
  handler: string;
  environment: { [key: string]: string };
  readPermissions: Table[];
}
export class APIFunction extends Construct {
  public readonly integration: LambdaIntegration;
  public readonly method: HTTPMethod;
  public readonly path: string;

  constructor(parent: Stack, props: APIFunctionProps) {
    super(parent, `api-${props.method}-${props.path}`);
    const name = `api-${props.method}-${props.path}`;
    const func = new NodejsFunction(this, name, {
      ...this.defaultFunctionProps,
      entry: props.main,
      handler: props.handler,
      depsLockFilePath: props.depsLockFilePath,
      environment: props.environment,
    });

    this.integration = new LambdaIntegration(func);
    this.method = props.method;
    this.path = props.path;

    props.readPermissions.forEach((t) => t.grantReadData(func));
  }
  private get defaultFunctionProps(): NodejsFunctionProps {
    return {
      bundling: {
        loader: {
          ".node": "file",
        },
        externalModules: [
          "aws-sdk", // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      runtime: Runtime.NODEJS_16_X,
    };
  }
}
