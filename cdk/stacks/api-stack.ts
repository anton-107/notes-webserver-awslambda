import { App, Stack } from "aws-cdk-lib";
import { APIGateway } from "../constructs/api-gateway";
import { routes } from "notes-webserver/dist/router";
import { APIFunction } from "../constructs/api-function";
import { join } from "path";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export class ApiStack extends Stack {
  private usersTable: Table;
  private notebooksTable: Table;

  constructor(private parent: App) {
    super(parent, "NotesWebserverApiStack");

    const jwtSerializerSecret = new Secret(this, "jwtSerializerSecret", {
      description: "jwtSerializerSecret for notes-webserver application",
    });

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

    this.notebooksTable = new Table(this, "notebooks", {
      partitionKey: {
        name: "owner",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sortKey",
        type: AttributeType.STRING,
      },
      tableName: "notes-webserver-notebook",
      readCapacity: 1,
      writeCapacity: 1,
    });

    const apiFunctions = routes.map((route) => {
      return new APIFunction(this, {
        depsLockFilePath: join(__dirname, "..", "..", "package-lock.json"),
        main: `${route.import}.js`,
        method: route.method,
        path: this.preparePath(route.path),
        handler: route.action,
        environment: {
          BASE_URL: "/prod",
          USER_STORE_TYPE: "dynamodb",
          NOTEBOOK_STORE_TYPE: "dynamodb",
          JWT_SERIALIZER_SECRET_ID: jwtSerializerSecret.secretName,
        },
        tableReadPermissions: this.getReadPermissions(route.method, route.path),
        tableWritePermissions: this.getWritePermissions(
          route.method,
          route.path
        ),
        secretReadPermissions: [jwtSerializerSecret],
      });
    });

    new APIGateway(this, {
      apiName: "NotesWebserverAPI",
      functions: apiFunctions,
    });
  }

  private getReadPermissions(method: string, path: string): Table[] {
    switch (method) {
      case "POST":
        switch (path) {
          case "/signin":
            return [this.usersTable];
        }
        break;
      case "GET":
        switch (path) {
          case "/home":
            return [this.notebooksTable];
          case "/notebook/:notebookID":
            return [this.notebooksTable];
        }
        break;
    }
    return [];
  }
  private getWritePermissions(method: string, path: string): Table[] {
    switch (method) {
      case "POST":
        switch (path) {
          case "/notebook":
            return [this.notebooksTable];
        }
        break;
    }
    return [];
  }
  private preparePath(path: string) {
    // converting from Express format of path param's to API GW format:
    return path.replace(":notebookID", "{notebookID}");
  }
}
