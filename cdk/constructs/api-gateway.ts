import { APIFunction } from "./api-function";
import { Construct } from "constructs";
import {
  IResource,
  MockIntegration,
  PassthroughBehavior,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Stack } from "aws-cdk-lib";

interface APIGatewayProps {
  functions: APIFunction[];
  apiName: string;
  apiAccessControlAllowOrigin: string;
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
            this.addCORSOptions(currentResource);
            this.resources[currentPath] = currentResource;
          } else {
            currentResource = this.resources[currentPath];
          }
        }
      });
      currentResource.addMethod(func.method, func.integration);
    });
  }
  private addCORSOptions(resource: IResource) {
    resource.addMethod(
      "OPTIONS",
      new MockIntegration({
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers":
                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
              "method.response.header.Access-Control-Allow-Origin":
                this.props.apiAccessControlAllowOrigin,
              "method.response.header.Access-Control-Allow-Credentials":
                "'true'",
              "method.response.header.Access-Control-Allow-Methods":
                "'OPTIONS,GET,PUT,POST,PATCH,DELETE'",
            },
          },
        ],
        passthroughBehavior: PassthroughBehavior.NEVER,
        requestTemplates: {
          "application/json": '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
        ],
      }
    );
  }
}
