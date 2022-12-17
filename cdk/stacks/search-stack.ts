import { App, Stack, CfnResource, Reference } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

interface SearchStackProps {
  enableServerlessCollection: boolean;
}

export class SearchStack extends Stack {
  private domainEndpoint: Reference | undefined = undefined;

  constructor(private parent: App, props: SearchStackProps) {
    super(parent, "NotesWebserverSearchStack");
    if (props.enableServerlessCollection) {
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
    }

    new s3.Bucket(this, "NotesWebserver-OpenSearchDeliveryBackup", {});
  }

  public getDomainEndpoint(): Reference | undefined {
    return this.domainEndpoint;
  }
}
