import { App, Stack } from "aws-cdk-lib";
import { APIGateway } from "../constructs/api-gateway";
import { routes } from "notes-webserver/dist/router";
import { APIFunction } from "../constructs/api-function";
import { join } from "path";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";

export class ApiStack extends Stack {
  private usersTable: Table;

  constructor(private parent: App) {
    super(parent, "NotesWebserverApiStack");

    this.usersTable = new Table(this, "usersTable", {
      partitionKey: {
        name: "username",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sortKey",
        type: AttributeType.STRING,
      },
      tableName: "notes-webserver-users",
      readCapacity: 1,
      writeCapacity: 1,
    });

    new APIGateway(this, {
      apiName: "NotesWebserverAPI",
      functions: routes.map((route) => {
        return new APIFunction(this, {
          depsLockFilePath: join(__dirname, "..", "..", "package-lock.json"),
          main: `${route.import}.js`,
          method: route.method,
          path: route.path,
          handler: route.action,
          environment: {
            BASE_URL: "/prod",
            USER_STORE_TYPE: "dynamodb",
          },
          readPermissions: this.getReadPermissions(route.method, route.path),
        });
      }),
    });
  }
  private getReadPermissions(method: string, path: string): Table[] {
    switch (method) {
      case "POST":
        switch (path) {
          case "/signin":
            return [this.usersTable];
        }
    }
    return [];
  }
}
