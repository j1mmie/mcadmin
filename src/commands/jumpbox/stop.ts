import { CommandLoader } from '../../lib/command-loading.ts'
import { getGlobalConfig } from '../../program/global-config.ts'
import {
  EC2Client,
  DescribeInstancesCommand,
  StopInstancesCommand,
} from '@aws-sdk/client-ec2'
import { setTimeout } from 'timers/promises'

async function getInstanceDetails(ec2Client: EC2Client, instanceId: string) {
  const command = new DescribeInstancesCommand({
    InstanceIds: [instanceId]
  })
  const response = await ec2Client.send(command)
  return response.Reservations?.[0]?.Instances?.[0]
}

async function perform() {
  const config = getGlobalConfig()
  const ec2Client = new EC2Client({ region: config.region })
  const instanceId = config.sshInstanceId

  const instance = await getInstanceDetails(ec2Client, instanceId)

  if (!instance) throw new Error('Instance not found')

  console.log('Instance ID:', instance.InstanceId)
  console.log('Instance state:', instance.State?.Name)

  if (instance.State?.Name === 'running') {
    console.log('Sending the stop command...')
    const stopCommand = new StopInstancesCommand({
      InstanceIds: [instanceId]
    })
    await ec2Client.send(stopCommand)
  }

  // Wait for the instance to stop
  while (true) {
    console.log('Checking instance state...')

    const instance = await getInstanceDetails(ec2Client, instanceId)
    if (!instance) throw new Error('Instance not found')

    console.log('Instance state:', instance.State?.Name)

    if (instance.State?.Name === 'stopped') {
      break
    }

    await setTimeout(5000) // 5 second polling interval
  }
}

export const JumpboxStop: CommandLoader = (program) => {
  program
    .command('stop')
    .description('Stop the EC2 instance that is used for managing the Minecraft server\'s files')
    .action(perform)
}