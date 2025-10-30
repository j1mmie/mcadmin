import { CommandLoader } from '../lib/command-loading'
import { getGlobalConfig } from '../program/global-config'
import { start } from './start'
import { stop } from './stop'

async function perform() {
  try {
    const config = getGlobalConfig()
    await start(config)
    await stop(config)
  } catch (error) {
    console.error('Failed to restart container:', error)
    throw error
  }
}

export const Restart:CommandLoader = (program) => {
  program
    .command('restart')
    .description('Restart the game server, if running')
    .action(perform)
}