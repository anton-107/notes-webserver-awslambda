import { App, Stack } from "aws-cdk-lib";
import { APIGateway } from "../constructs/api-gateway";
import { routes } from "notes-webserver/dist/router";
import { APIFunction } from "../constructs/api-function";
import { join } from "path";

export class ApiStack extends Stack {
  constructor(private parent: App) {
    super(parent, "NotesWebserverApiStack");
    new APIGateway(this, {
      apiName: "NotesWebserverAPI",
      functions: routes.map((route) => {
        console.log("import:", route.import);
        return new APIFunction(this, {
          depsLockFilePath: join(__dirname, "..", "..", "package-lock.json"),
          main: `${route.import}.js`,
          method: route.method,
          path: route.path,
          handler: route.action,
        });
      }),
    });
  }
}
