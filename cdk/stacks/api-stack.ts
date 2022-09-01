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
  private peopleTable: Table;

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

    this.peopleTable = new Table(this, "people", {
      partitionKey: {
        name: "manager",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sortKey",
        type: AttributeType.STRING,
      },
      tableName: "notes-webserver-people",
      readCapacity: 1,
      writeCapacity: 1,
    });

    const corsAllowedOrigins = "http://localhost:8080";

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
          NOTE_STORE_TYPE: "dynamodb",
          PERSON_STORE_TYPE: "dynamodb",
          JWT_SERIALIZER_SECRET_ID: jwtSerializerSecret.secretName,
          CORS_ALLOWED_ORIGINS: corsAllowedOrigins,
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
      apiAccessControlAllowOrigin: `'${corsAllowedOrigins}'`,
    });
  }

  private getReadPermissions(method: string, path: string): Table[] {
    switch (method) {
      case "POST":
        switch (path) {
          case "/signin":
            return [this.usersTable];
          case "/note":
          case "/note/:noteID/edit":
          case "/note/delete":
            return [this.notebooksTable];
        }
        break;
      case "GET":
        switch (path) {
          case "/home":
            return [this.notebooksTable, this.peopleTable];
          case "/notebook":
          case "/notebook/:notebookID/edit":
          case "/notebook/:notebookID/note":
            return [this.notebooksTable];
          case "/notebook/:notebookID":
          case "/notebook/:notebookID/new-note/:noteType":
          case "/notebook/:notebookID/note/:noteID/edit":
            return [this.notebooksTable, this.peopleTable];
          case "/person/:personID":
          case "/person/:personID/edit":
            return [this.peopleTable];
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
          case "/notebook/:notebookID/edit":
          case "/delete-notebook":
          case "/note":
          case "/note/:noteID/edit":
          case "/note/delete":
            return [this.notebooksTable];
          case "/person":
          case "/person/:personID/edit":
          case "/delete-person":
            return [this.peopleTable];
        }
        break;
    }
    return [];
  }
  private preparePath(path: string) {
    // converting from Express format of path param's to API GW format:
    return path
      .replace(":notebookID", "{notebookID}")
      .replace(":personID", "{personID}")
      .replace(":noteType", "{noteType}")
      .replace(":noteID", "{noteID}");
  }
}
