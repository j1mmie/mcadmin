import { CommandLoader } from '../lib/command-loading'
import { ConfigInterface, getGlobalConfig } from '../program/global-config'
import { setECSServiceTaskCount } from '../aws/set-task-desired-count'
import { pollServerUntilPortOpen } from '../lib/minecraft/poll-server-until-port-open'
import { monitorECSService } from '../aws/monitor-ecs-service'

export async function start(config:ConfigInterface) {
  await setECSServiceTaskCount(
    config.region,
    config.clusterName,
    config.serviceName,
    1
  )

  await monitorECSService(
    config.region,
    config.clusterName,
    config.serviceName,
    2,
    5
  )

  console.log('Service started successfully. Waiting for java port to open up')

  await pollServerUntilPortOpen(
    config.gameHostName,
    config.javaPort,
    5,
    10,
    () => {
      console.log(`Attempting to connect to ${ config.gameHostName } on port ${ config.javaPort }`)
    }
  )

  console.log('Game server up and ready for connections')
}

async function perform() {
  try {
    const config = getGlobalConfig()
    await start(config)
  } catch (error) {
    console.error('Failed to scale service:', error)
    throw error
  }
}

export const Start:CommandLoader = (program) => {
  program
    .command('start')
    .action(perform)
}