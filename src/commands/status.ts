import { CommandLoader } from '../lib/command-loading'
import { getGlobalConfig } from '../program/global-config'
import { monitorECSService } from '../aws/monitor-ecs-service'

async function perform() {
  try {
    const config = getGlobalConfig()

    await monitorECSService(
      config.region,
      config.clusterName,
      config.serviceName,
      undefined,
      5 // seconds
    )
  } catch (error) {
    console.error('ECS monitoring failed:', error)
    throw error
  }
}

export const Status: CommandLoader = (program) => {
  program
    .command('status')
    .action(perform)
}