import { App, Stack } from "aws-cdk-lib";
import { AttributeType, StreamViewType, Table } from "aws-cdk-lib/aws-dynamodb";

export class DatabaseStack extends Stack {
  public readonly usersTable: Table;
  public readonly notebooksTable: Table;
  public readonly peopleTable: Table;

  constructor(private parent: App) {
    super(parent, "NotesWebserverDatabaseStack");
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
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
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
  }
}
