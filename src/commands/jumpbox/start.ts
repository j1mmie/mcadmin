import { Command } from 'commander'
import { CommandLoader } from '../../lib/command-loading.ts'
import { getGlobalConfig } from '../../program/global-config.ts'
import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  DescribeInstanceStatusCommand,
  Instance
} from '@aws-sdk/client-ec2'
import { setTimeout } from 'timers/promises'

async function getInstanceDetails(ec2Client: EC2Client, instanceId: string): Promise<Instance | undefined> {
  const command = new DescribeInstancesCommand({
    InstanceIds: [instanceId]
  })
  const response = await ec2Client.send(command)
  return response.Reservations?.[0]?.Instances?.[0]
}

async function startInstance(ec2Client: EC2Client, instanceId: string): Promise<void> {
  const command = new StartInstancesCommand({
    InstanceIds: [instanceId]
  })
  await ec2Client.send(command)
}

async function waitForInstance(ec2Client: EC2Client, instanceId: string): Promise<string> {
  while (true) {
    console.log('Checking instance state...')

    const instance = await getInstanceDetails(ec2Client, instanceId)
    if (!instance) throw new Error('Instance not found')

    console.log('Instance state:', instance.State?.Name)

    if (instance.State?.Name === 'running' && instance.PublicDnsName) {
      // Additional check for system status
      const statusCommand = new DescribeInstanceStatusCommand({
        InstanceIds: [instanceId]
      })
      const statusResponse = await ec2Client.send(statusCommand)
      const systemStatus = statusResponse.InstanceStatuses?.[0]?.SystemStatus?.Status
      const instanceStatus = statusResponse.InstanceStatuses?.[0]?.InstanceStatus?.Status

      console.log('System status:', systemStatus)
      console.log('Instance status:', instanceStatus)

      if (systemStatus === 'ok' && instanceStatus === 'ok') {
        return instance.PublicDnsName
      }
    }

    await setTimeout(5000) // 5 second polling interval
  }
}

async function perform() {
  const config = getGlobalConfig()
  const ec2Client = new EC2Client({ region: config.region })
  const instanceId = config.sshInstanceId

  try {
    const instance = await getInstanceDetails(ec2Client, instanceId)
    if (!instance) throw new Error('Instance not found')

    if (instance.State?.Name === 'stopped') {
      console.log('Starting instance...')
      await startInstance(ec2Client, instanceId)
    }

    console.log('Waiting for instance to be ready...')
    const publicDnsName = await waitForInstance(ec2Client, instanceId)

    console.log('Connect via SSH with: ')
    console.log(`ssh -i ${ config.sshKeyPath } ec2-user@${ publicDnsName }`)
  } catch (error) {
    console.error('SSH connection failed:', error)
    throw error
  }
}

export const JumpboxStart: CommandLoader = (program:Command) => {
  program
    .command('start')
    .description('SSH into an EC2 instance that can be used to manage the Minecraft server\'s files')
    .action(perform)
}