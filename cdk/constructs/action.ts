import { Duration, Stack } from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { IEventSource, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

interface ActionProps {
  actionName: string;
  main: string;
  handler: string;
  depsLockFilePath: string;
  environment: { [key: string]: string };
  tableReadPermissions: Table[];
  tableWritePermissions: Table[];
  bucketReadPermissions: Bucket[];
  bucketWritePermissions: Bucket[];
  secretReadPermissions: Secret[];
  eventSource: IEventSource;
  timeout: Duration;
}

export class Action extends Construct {
  constructor(parent: Stack, props: ActionProps) {
    super(parent, `action-${props.actionName}`);
    const name = `action-${props.actionName}`;
    const func = new NodejsFunction(this, name, {
      ...this.defaultFunctionProps,
      entry: props.main,
      handler: props.handler,
      depsLockFilePath: props.depsLockFilePath,
      environment: props.environment,
      timeout: props.timeout,
    });
    props.tableReadPermissions.forEach((t) => t.grantReadData(func));
    props.tableWritePermissions.forEach((t) => t.grantWriteData(func));
    props.secretReadPermissions.forEach((s) => s.grantRead(func));
    props.bucketReadPermissions.forEach((s) => s.grantRead(func));
    props.bucketWritePermissions.forEach((s) => {
      s.grantWrite(func);
      s.grantPut(func);
    });
    func.addEventSource(props.eventSource);
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
