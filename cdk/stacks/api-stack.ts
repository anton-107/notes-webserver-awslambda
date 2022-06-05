import { App, Stack } from "aws-cdk-lib";

export class ApiStack extends Stack {
  constructor(private parent: App) {
    super(parent, "NotesWebserverApiStack");
  }
}
