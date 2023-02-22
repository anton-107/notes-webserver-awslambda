import { App, Reference } from "aws-cdk-lib";
import { ApiStack } from "./stacks/api-stack";
import { DatabaseStack } from "./stacks/database-stack";
import { SearchStack } from "./stacks/search-stack";
import { WorkflowsStack } from "./stacks/workflows-stack";

function main() {
  const app = new App();
  let searchDomainEndpoint: Reference | undefined = undefined;
  const searchStack = new SearchStack(app, {
    enableServerlessCollection: process.env["ENABLE_SEARCH"] === "true",
  });
  searchDomainEndpoint = searchStack.getDomainEndpoint();

  const databaseStack = new DatabaseStack(app);

  const workflowStack = new WorkflowsStack(app, {
    notebooksTable: databaseStack.notebooksTable,
  });
  new ApiStack(app, {
    notebooksTable: databaseStack.notebooksTable,
    peopleTable: databaseStack.peopleTable,
    usersTable: databaseStack.usersTable,
    searchDomainEndpoint,
    notebookDeletionStateMachine: workflowStack.workflows["notebook-deletion"],
  });
}
main();
