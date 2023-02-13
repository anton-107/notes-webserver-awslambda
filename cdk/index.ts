import { App, Reference } from "aws-cdk-lib";
import { ApiStack } from "./stacks/api-stack";
import { SearchStack } from "./stacks/search-stack";
import { WorkflowsStack } from "./stacks/workflows-stack";

function main() {
  const app = new App();
  let searchDomainEndpoint: Reference | undefined = undefined;
  const searchStack = new SearchStack(app, {
    enableServerlessCollection: process.env["ENABLE_SEARCH"] === "true",
  });
  searchDomainEndpoint = searchStack.getDomainEndpoint();
  const workflowStack = new WorkflowsStack(app);
  new ApiStack(app, {
    searchDomainEndpoint,
    notebookDeletionStateMachine: workflowStack.workflows["notebook-deletion"],
  });
}
main();
