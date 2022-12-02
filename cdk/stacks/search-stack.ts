import { App, Stack } from "aws-cdk-lib";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";
import * as s3 from "aws-cdk-lib/aws-s3";

export class SearchStack extends Stack {
  private domainEndpoint: string;

  constructor(private parent: App) {
    super(parent, "NotesWebserverSearchStack");
    const searchDomain = new opensearch.Domain(
      this,
      "NotesWebserver-ReferencesSearchDomain",
      {
        version: opensearch.EngineVersion.OPENSEARCH_1_3,
        enableVersionUpgrade: true,
        capacity: {
          masterNodeInstanceType: "t3.small.search",
          dataNodeInstanceType: "t3.small.search",
        },
      }
    );
    this.domainEndpoint = searchDomain.domainEndpoint;

    new s3.Bucket(this, "NotesWebserver-OpenSearchDeliveryBackup", {});
  }

  public getDomainEndpoint(): string {
    return this.domainEndpoint;
  }
}
