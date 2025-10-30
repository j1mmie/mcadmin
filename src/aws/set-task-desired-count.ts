import {
  ECSClient,
  UpdateServiceCommand,
  DescribeServicesCommand,
  UpdateServiceCommandInput
} from '@aws-sdk/client-ecs'

export async function setECSServiceTaskCount(
  region: string,
  clusterName: string,
  serviceName: string,
  desiredCount: number
): Promise<void> {
  const ecsClient = new ECSClient({ region })

  // First, verify the service exists
  const describeCommand = new DescribeServicesCommand({
    cluster: clusterName,
    services: [serviceName]
  })

  const serviceDescription = await ecsClient.send(describeCommand)

  if (!serviceDescription.services || serviceDescription.services.length === 0) {
    throw new Error(`Service ${ serviceName } not found in cluster ${ clusterName }`)
  }

  // Prepare the update command
  const updateParams: UpdateServiceCommandInput = {
    cluster: clusterName,
    service: serviceName,
    desiredCount: desiredCount
  }

  try {
    const updateCommand = new UpdateServiceCommand(updateParams)
    await ecsClient.send(updateCommand)

    console.log(`Successfully updated ${ serviceName } desired task count to ${ desiredCount }`)

    // Get the current service status after update
    const updatedService = await ecsClient.send(describeCommand)
    const service = updatedService.services?.[0]

    if (!service) return

    console.log(`Current service status:`)
    console.log(`  Desired count: ${ service.desiredCount }`)
    console.log(`  Running count: ${ service.runningCount }`)
    console.log(`  Pending count: ${ service.pendingCount }`)
  } catch (error) {
    console.error('Failed to update service:', error)
    throw error
  }
}
