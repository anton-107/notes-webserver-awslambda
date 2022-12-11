import { App, Stack, CfnResource, Reference } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

export class SearchStack extends Stack {
  private domainEndpoint: Reference;

  constructor(private parent: App) {
    super(parent, "NotesWebserverSearchStack");
    const collection = new CfnResource(
      this,
      "NotesWebserver-ReferencesCollection",
      {
        type: "AWS::OpenSearchServerless::Collection",
        properties: {
          Name: "noteswebserver-references",
          Type: "SEARCH",
        },
      }
    );
    this.domainEndpoint = collection.getAtt("CollectionEndpoint");

    new s3.Bucket(this, "NotesWebserver-OpenSearchDeliveryBackup", {});
  }

  public getDomainEndpoint(): Reference {
    return this.domainEndpoint;
  }
}
