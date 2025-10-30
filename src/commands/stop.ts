import { CommandLoader } from '../lib/command-loading'
import { setECSServiceTaskCount } from '../aws/set-task-desired-count'
import { ConfigInterface, getGlobalConfig } from '../program/global-config'
import { monitorECSService } from '../aws/monitor-ecs-service'

export async function stop(config:ConfigInterface) {
  await setECSServiceTaskCount(
    config.region,
    config.clusterName,
    config.serviceName,
    0
  )

  await monitorECSService(
    config.region,
    config.clusterName,
    config.serviceName,
    0,
    5
  )
}

async function perform() {
  try {
    const config = getGlobalConfig()
    await stop(config)
  } catch (error) {
    console.error('Failed to scale service:', error)
    throw error
  }
}

export const Stop: CommandLoader = (program) => {
  program
    .command('stop')
    .action(perform)
}