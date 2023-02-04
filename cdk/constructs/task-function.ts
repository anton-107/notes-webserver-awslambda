import { Stack } from "aws-cdk-lib";
import { Runtime, IFunction } from "aws-cdk-lib/aws-lambda";
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
