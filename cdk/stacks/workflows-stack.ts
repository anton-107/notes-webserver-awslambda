import { App, Stack } from "aws-cdk-lib";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import {
  IChainable,
  INextable,
  StateMachine,
  Succeed,
} from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { workflows } from "notes-webserver/dist/router";
import { join } from "path";
import { TaskFunction } from "../constructs/task-function";

interface WorkflowsStackProperties {
  notebooksTable: ITable;
}

export class WorkflowsStack extends Stack {
  public readonly workflows: Record<string, StateMachine> = {};
  constructor(parent: App, private properties: WorkflowsStackProperties) {
    super(parent, "NotesWorkflowsStack");

    workflows.map((workflow) => {
      const tasks: (INextable & IChainable)[] = [];
      const workflowName = workflow.name;

      workflow.tasks.forEach((task) => {
        if (!task.action) {
          return;
        }
        tasks.push(
          new LambdaInvoke(this, task.action.actionName, {
            lambdaFunction: new TaskFunction(this, {
              workflowName,
              taskName: task.action.actionName,
              main: `${task.action.import}.js`,
              depsLockFilePath: join(
                __dirname,
                "..",
                "..",
                "package-lock.json"
              ),
              handler: task.action.action,
              environment: {
                NOTEBOOK_STORE_TYPE: "dynamodb",
                NOTE_STORE_TYPE: "dynamodb",
                NOTE_ATTACHMENTS_STORE_TYPE: "dynamodb",
              },
              tableReadPermissions: [this.properties.notebooksTable],
              tableWritePermissions: [this.properties.notebooksTable],
            }).lambdaFunction,
          })
        );
      });
      for (let i = 0; i < tasks.length; i += 1) {
        const next =
          i < tasks.length - 1
            ? tasks[i + 1]
            : new Succeed(this, `${workflowName}-success`);
        tasks[i].next(next);
      }
      const stateMachine = new StateMachine(
        this,
        `notes-webserver-workflow-${workflowName}`,
        {
          definition: tasks[0],
        }
      );
      this.workflows[workflow.name] = stateMachine;
    });
  }
}
