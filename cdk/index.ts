import { App, Reference } from "aws-cdk-lib";
import { ApiStack } from "./stacks/api-stack";
import { SearchStack } from "./stacks/search-stack";

function main() {
  const app = new App();
  let searchDomainEndpoint: Reference | undefined = undefined;
  const searchStack = new SearchStack(app, {
    enableServerlessCollection: process.env["ENABLE_SEARCH"] === "true",
  });
  searchDomainEndpoint = searchStack.getDomainEndpoint();
  new ApiStack(app, {
    searchDomainEndpoint,
  });
}
main();
