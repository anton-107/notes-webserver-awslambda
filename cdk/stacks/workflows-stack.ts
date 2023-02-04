import { App, Stack } from "aws-cdk-lib";
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

export class WorkflowsStack extends Stack {
  constructor(parent: App) {
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
              environment: {},
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
      new StateMachine(this, `notes-webserver-workflow-${workflowName}`, {
        definition: tasks[0],
      });
    });
  }
}
