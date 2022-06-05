import { App } from "aws-cdk-lib";
import { ApiStack } from "./stacks/api-stack";

function main() {
  const app = new App();
  new ApiStack(app);
}
main();
