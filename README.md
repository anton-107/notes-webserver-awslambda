# Deploy the Notes Webserver app to your AWS account

Run:

```
$ AWS_PROFILE=<YOUR CONFIGURED PROFILE NAME> AWS_REGION=<YOUR REGION> ENABLE_SEARCH=false npm run deploy -- --all
```

# Deploy an indvidual stack

Run:

```
AWS_PROFILE=<YOUR CONFIGURED PROFILE NAME> AWS_REGION=eu-west-1 ENABLE_SEARCH=false npm run deploy -- NotesWebserverApiStack
AWS_PROFILE=<YOUR CONFIGURED PROFILE NAME> AWS_REGION=eu-west-1 ENABLE_SEARCH=false npm run deploy -- NotesWorkflowsStack
```
