import {
  ECSClient,
  DescribeServicesCommand,
  DescribeTasksCommand,
  ListTasksCommand,
  Service
} from '@aws-sdk/client-ecs'

import { setIntervalAsync, clearIntervalAsync } from 'set-interval-async/dynamic'

interface ContainerStatus {
  containerName: string
  lastStatus: string
  healthStatus: string
  image: string
  cpu: string
  memory: string
  startedAt?: Date
  stoppedAt?: Date
  exitCode?: number
  reason?: string
}

interface ServiceStatus {
  serviceName: string
  desiredCount: number
  runningCount: number
  pendingCount: number
  containers: ContainerStatus[]
  deploymentStatus: string
  events: string[]
}

async function getECSContainerStatus(
  region: string,
  clusterName: string,
  serviceName: string
): Promise<ServiceStatus> {
  const ecsClient = new ECSClient({ region })

  // Get service details
  const describeServicesCommand = new DescribeServicesCommand({
    cluster: clusterName,
    services: [serviceName],
  })

  const serviceResponse = await ecsClient.send(describeServicesCommand)
  const service = serviceResponse.services?.[0]

  if (!service) {
    throw new Error(
      `Service ${ serviceName } not found in cluster ${ clusterName }`
    )
  }

  // Get all tasks for the service
  const listTasksCommand = new ListTasksCommand({
    cluster: clusterName,
    serviceName: serviceName,
  })

  const tasksResponse = await ecsClient.send(listTasksCommand)
  const taskArns = tasksResponse.taskArns || []

  let containers: ContainerStatus[] = []

  if (taskArns.length > 0) {
    // Get detailed task information
    const describeTasks = new DescribeTasksCommand({
      cluster: clusterName,
      tasks: taskArns,
    })

    const taskDetails = await ecsClient.send(describeTasks)
    const tasks = taskDetails.tasks || []


    // Extract container information from tasks
    containers = tasks.flatMap(
      (task) =>
        task.containers?.map((container) => {
          return {
            containerName: container.name || 'unknown',
            lastStatus: container.lastStatus || 'unknown',
            healthStatus: container.healthStatus || 'unknown',
            image: container.image || 'unknown',
            cpu: task.cpu || 'n/a',
            memory: task.memory || 'n/a',
            createdAt: task.createdAt,
            stoppedAt: task.stoppedAt,
            exitCode: container.exitCode,
            reason: container.reason,
          }
        }) || []
    )
  }

  // Compile service status
  const serviceStatus: ServiceStatus = {
    serviceName: service.serviceName || serviceName,
    desiredCount: service.desiredCount || 0,
    runningCount: service.runningCount || 0,
    pendingCount: service.pendingCount || 0,
    containers: containers,
    deploymentStatus: getDeploymentStatus(service),
    events: (service.events || [])
      .slice(0, 5)
      .map((event) => event.message || ''),
  }

  return serviceStatus
}

function getDeploymentStatus(service: Service): string {
  const deployments = service.deployments || []
  if (deployments.length === 0) return 'NO_DEPLOYMENTS'

  const primaryDeployment = deployments.find((d) => d.status === 'PRIMARY')
  if (!primaryDeployment) return 'NO_PRIMARY_DEPLOYMENT'

  const runningCount = primaryDeployment.runningCount ?? 0
  const desiredCount = primaryDeployment.desiredCount ?? 0

  if (runningCount === desiredCount) {
    return 'STABLE'
  } else if (runningCount < desiredCount) {
    return 'DEPLOYING'
  } else {
    return 'SCALING_DOWN'
  }
}

enum MonitorResult {
  StopMonitoring,
  ContinueMonitoring
}

export async function monitorECSService(
  region: string,
  clusterName: string,
  serviceName: string,
  targetContainersRunningCount: number | undefined,
  intervalSeconds: number
): Promise<void> {
  console.log(`Starting monitoring for cluster: ${ clusterName }`)
  console.log('Services:', serviceName)
  console.log('---')

  const monitor = async ():Promise<MonitorResult> => {
    try {
      const status = await getECSContainerStatus(
        region,
        clusterName,
        serviceName
      )

      console.log()
      console.log(`Service: ${ status.serviceName }`)
      console.log(`Status: ${ status.deploymentStatus }`)
      console.log(`Desired Task Count: ${ status.desiredCount }`)
      console.log(`Running Task Count: ${ status.runningCount }`)
      console.log(`Pending Task Count: ${ status.pendingCount }`)

      const containersTotalCount = status.containers.length
      const containersRunningCount = status.containers.filter(
        c => c.lastStatus === 'RUNNING'
      ).length

      if (containersTotalCount === 0) {
        console.log('Containers: 0 RUNNING')
        if (targetContainersRunningCount === 0) {
          console.log('All containers stopped.')
          return MonitorResult.StopMonitoring
        }
      } else {
        console.log(`Containers: ${ containersRunningCount }/${ containersTotalCount } status RUNNING`)
      }

      status.containers.forEach((container) => {
        console.log()
        console.log(`  Container: ${ container.containerName }`)
        console.log(`  Status:    ${ container.lastStatus } (Health: ${ container.healthStatus })`)
        console.log(`  Image:     ${ container.image }`)
        console.log(`  Resources: CPU: ${ container.cpu }, Memory: ${ container.memory }`)

        if (container.startedAt) {
          console.log(`  Started: ${ container.startedAt.toISOString() }`)
        }

        if (container.reason) {
          console.log(`  Reason: ${ container.reason }`)
        }
      })

      if (targetContainersRunningCount === containersRunningCount) {
        console.log('All containers running.')
        return MonitorResult.StopMonitoring
      }

    } catch (error) {
      console.error(`  Error monitoring service ${ serviceName }:`, error)
    }

    return MonitorResult.ContinueMonitoring
  }

  return new Promise<void>(async (resolve, reject) => {
    // Initial check
    const result = await monitor()
    if (result === MonitorResult.StopMonitoring) {
      return
    }

    if (intervalSeconds <= .001) return

    // Set up periodic monitoring
    const interval = setIntervalAsync(async () => {
      const result2 = await monitor()
      if (result2 === MonitorResult.StopMonitoring) {
        clearIntervalAsync(interval)
        resolve()
      }
    }, intervalSeconds * 1000)
  })
}
