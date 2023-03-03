import { Duration, Stack } from "aws-cdk-lib";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { IFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

interface TaskFunctionProps {
  workflowName: string;
  taskName: string;
  main: string;
  depsLockFilePath: string;
  handler: string;
  environment: { [key: string]: string };
  tableReadPermissions: ITable[];
  tableWritePermissions: ITable[];
}
export class TaskFunction extends Construct {
  public readonly lambdaFunction: IFunction;
  constructor(parent: Stack, props: TaskFunctionProps) {
    super(parent, `task-${props.workflowName}-${props.taskName}`);
    const name = `task-${props.workflowName}-${props.taskName}`;

    this.lambdaFunction = new NodejsFunction(this, name, {
      ...this.defaultFunctionProps,
      entry: props.main,
      handler: props.handler,
      depsLockFilePath: props.depsLockFilePath,
      environment: props.environment,
    });
    props.tableReadPermissions.forEach((t) =>
      t.grantReadData(this.lambdaFunction)
    );
    props.tableWritePermissions.forEach((t) =>
      t.grantWriteData(this.lambdaFunction)
    );
  }
  private get defaultFunctionProps(): NodejsFunctionProps {
    return {
      timeout: Duration.seconds(10),
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
