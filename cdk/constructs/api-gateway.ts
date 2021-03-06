import { APIFunction } from "./api-function";
import { Construct } from "constructs";
import { IResource, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Stack } from "aws-cdk-lib";

interface APIGatewayProps {
  functions: APIFunction[];
  apiName: string;
}

export class APIGateway extends Construct {
  private resources: { [key: string]: IResource } = {};

  constructor(parent: Stack, private props: APIGatewayProps) {
    super(parent, `APIGateway-${props.apiName}`);

    // Create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, props.apiName, {
      restApiName: props.apiName,
    });

    props.functions.forEach((func) => {
      const path = func.path;
      const pathParts = path.split("/");

      let currentResource = api.root;
      let currentPath = "";
      pathParts.forEach((part) => {
        if (part) {
          currentPath += `/${part}`;
          if (!this.resources[currentPath]) {
            currentResource = currentResource.addResource(part);
            this.resources[currentPath] = currentResource;
          } else {
            currentResource = this.resources[currentPath];
          }
        }
      });
      currentResource.addMethod(func.method, func.integration);
    });
  }
}
