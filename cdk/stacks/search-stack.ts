import { App, Stack } from "aws-cdk-lib";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";

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
  }

  public getDomainEndpoint(): string {
    return this.domainEndpoint;
  }
}
