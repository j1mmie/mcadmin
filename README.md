# admin

To install dependencies:
```bash
mise install
bun install
bun link
```

Setup config:
Create a `.mcadmin.json` file in your home directory with the following content:
```json
{
  "awsProfile":          string,
  "region":              string,
  "clusterName":         string,
  "serviceName":         string,
  "gameContainerName":   string,
  "sshInstanceId":       string,
  "sshKeyPath":          string,
  "sshUserName":         string,
  "gameHostName":        string,
  "javaPort":            number,
  "bedrockPort":         number,
  "watchDogLogGroupArn": string
}

`awsProfile` should be a profile configured in your AWS credentials file. The profile must exist in `~/.aws/config` and `~/.aws/credentials`.

`sshKeyPath` should be the path to your private key file for SSH access to the EC2 jumpbox. This isn't used by the program directly, but is used when providing you with copy/paste commands to connect to the jumpbox.

`watchDogLogGroupArn` is the ARN of the CloudWatch Log Group where the Minecraft server logs will be sent.

```

To run:
```bash
mcadmin
```

