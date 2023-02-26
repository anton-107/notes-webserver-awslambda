import { App, Duration, Reference, Stack } from "aws-cdk-lib";
import { APIGateway } from "../constructs/api-gateway";
import { routes, actions } from "notes-webserver/dist/router";
import { APIFunction } from "../constructs/api-function";
import { join } from "path";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Action } from "../constructs/action";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { IEventSource, StartingPosition } from "aws-cdk-lib/aws-lambda";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
} from "aws-cdk-lib/aws-s3";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";

interface ApiStackProperties {
  usersTable: ITable;
  notebooksTable: ITable;
  peopleTable: ITable;
  searchDomainEndpoint: Reference | undefined;
  notebookDeletionStateMachine: StateMachine;
}

export class ApiStack extends Stack {
  private attachmentsBucket: Bucket;
  private attachmentsFolder = "attachments";

  constructor(private parent: App, private properties: ApiStackProperties) {
    super(parent, "NotesWebserverApiStack");

    const jwtSerializerSecret = new Secret(this, "jwtSerializerSecret", {
      description: "jwtSerializerSecret for notes-webserver application",
    });

    this.attachmentsBucket = new Bucket(this, "attachments", {
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
    });

    const corsAllowedOrigins = "http://localhost:8080";
    const defaultTimeout = Duration.seconds(3);

    const apiFunctions = routes.map((route) => {
      const timeout = route.timeoutInSeconds
        ? Duration.seconds(route.timeoutInSeconds)
        : defaultTimeout;
      return new APIFunction(this, {
        depsLockFilePath: join(__dirname, "..", "..", "package-lock.json"),
        main: `${route.import}.js`,
        method: route.method,
        path: this.preparePath(route.path),
        handler: route.action,
        timeout,
        environment: {
          BASE_URL: "/prod",
          USER_STORE_TYPE: "dynamodb",
          NOTEBOOK_STORE_TYPE: "dynamodb",
          NOTE_STORE_TYPE: "dynamodb",
          NOTE_ATTACHMENTS_STORE_TYPE: "dynamodb",
          PERSON_STORE_TYPE: "dynamodb",
          JWT_SERIALIZER_SECRET_ID: jwtSerializerSecret.secretName,
          CORS_ALLOWED_ORIGINS: corsAllowedOrigins,
          S3_ATTACHMENTS_BUCKET: this.attachmentsBucket.bucketName,
          S3_ATTACHMENTS_FOLDER: this.attachmentsFolder,
          SEARCH_DOMAIN_ENDPOINT: this.properties.searchDomainEndpoint
            ? this.properties.searchDomainEndpoint.toString()
            : "undefined",
        },
        tableReadPermissions: this.getReadPermissions(route.method, route.path),
        tableWritePermissions: this.getWritePermissions(
          route.method,
          route.path
        ),
        secretReadPermissions: [jwtSerializerSecret],
        bucketReadPermissions: this.getBucketReadPermissions(
          route.method,
          route.path
        ),
        bucketWritePermissions: this.getBucketWritePermissions(
          route.method,
          route.path
        ),
      });
    });

    new APIGateway(this, {
      apiName: "NotesWebserverAPI",
      functions: apiFunctions,
      apiAccessControlAllowOrigin: `'${corsAllowedOrigins}'`,
    });

    actions.map((action) => {
      new Action(this, {
        actionName: action.actionName,
        main: `${action.import}.js`,
        handler: action.action,
        depsLockFilePath: join(__dirname, "..", "..", "package-lock.json"),
        timeout: Duration.seconds(30),
        environment: {
          YOUTUBE_PARSER_ENABLED: "true",
          S3_ATTACHMENTS_BUCKET: this.attachmentsBucket.bucketName,
          S3_ATTACHMENTS_FOLDER: this.attachmentsFolder,
          NOTE_ATTACHMENTS_STORE_TYPE: "dynamodb",
          NOTEBOOK_DELETION_STATE_MACHINE_ARN:
            this.properties.notebookDeletionStateMachine.stateMachineArn,
        },
        tableReadPermissions: this.getReadPermissions(
          "async-action",
          action.actionName
        ),
        tableWritePermissions: this.getWritePermissions(
          "async-action",
          action.actionName
        ),
        bucketReadPermissions: this.getBucketReadPermissions(
          "async-action",
          action.actionName
        ),
        bucketWritePermissions: this.getBucketWritePermissions(
          "async-action",
          action.actionName
        ),
        stateMachinePermissions: [this.properties.notebookDeletionStateMachine],
        secretReadPermissions: [],
        eventSource: this.getActionEventSource(action.eventSource),
      });
    });
  }

  private getReadPermissions(method: string, path: string): ITable[] {
    switch (method) {
      case "POST":
        switch (path) {
          case "/signin":
            return [this.properties.usersTable];
          case "/notebook/:notebookID/edit":
          case "/note":
          case "/note/:noteID/edit":
          case "/note/delete":
          case "/delete-notebook":
            return [this.properties.notebooksTable];
          case "/delete-person":
          case "/person/:personID/edit":
            return [this.properties.peopleTable];
        }
        break;
      case "GET":
        switch (path) {
          case "/home":
            return [
              this.properties.notebooksTable,
              this.properties.peopleTable,
            ];
          case "/notebook":
          case "/notebook/:notebookID/edit":
          case "/notebook/:notebookID/note":
          case "/note/:noteID/attachment":
          case "/note/:noteID/attachment/:attachmentID":
            return [this.properties.notebooksTable];
          case "/notebook/:notebookID":
          case "/notebook/:notebookID/new-note/:noteType":
          case "/notebook/:notebookID/note/:noteID/edit":
            return [
              this.properties.notebooksTable,
              this.properties.peopleTable,
            ];
          case "/person":
          case "/person/:personID":
          case "/person/:personID/edit":
            return [this.properties.peopleTable];
        }
        break;
    }
    return [];
  }
  private getWritePermissions(method: string, path: string): ITable[] {
    switch (method) {
      case "POST":
        switch (path) {
          case "/notebook":
          case "/notebook/:notebookID/edit":
          case "/delete-notebook":
          case "/note":
          case "/note/:noteID/edit":
          case "/note/delete":
            return [this.properties.notebooksTable];
          case "/person":
          case "/person/:personID/edit":
          case "/delete-person":
            return [this.properties.peopleTable];
        }
        break;
      case "async-action":
        switch (path) {
          case "fetch-video-information":
            return [this.properties.notebooksTable];
        }
    }
    return [];
  }
  private getBucketReadPermissions(method: string, path: string): Bucket[] {
    switch (method) {
      case "GET":
        switch (path) {
          case "/note/:noteID/attachment/:attachmentID":
            return [this.attachmentsBucket];
        }
    }
    return [];
  }
  private getBucketWritePermissions(method: string, path: string): Bucket[] {
    switch (method) {
      case "async-action":
        switch (path) {
          case "fetch-video-information":
            return [this.attachmentsBucket];
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
      .replace(":noteID", "{noteID}")
      .replace(":attachmentID", "{attachmentID}");
  }
  private getActionEventSource(eventSourceName: string): IEventSource {
    switch (eventSourceName) {
      case "notebook-entries":
      case "note-entries":
        return new DynamoEventSource(this.properties.notebooksTable, {
          startingPosition: StartingPosition.LATEST,
        });
      default:
        throw Error(`Event source not supported: ${eventSourceName}`);
    }
  }
}
