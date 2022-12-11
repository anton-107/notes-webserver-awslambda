import { App, Reference } from "aws-cdk-lib";
import { ApiStack } from "./stacks/api-stack";
import { SearchStack } from "./stacks/search-stack";

function main() {
  const app = new App();
  let searchDomainEndpoint: Reference | undefined = undefined;
  if (process.env["ENABLE_SEARCH"] === "true") {
    const searchStack = new SearchStack(app);
    searchDomainEndpoint = searchStack.getDomainEndpoint();
  }
  new ApiStack(app, {
    searchDomainEndpoint,
  });
}
main();
