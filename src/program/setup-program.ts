import { Command } from 'commander'

export function setupProgram() {
  const program = new Command()

  program
    .name('mcadmin')
    .description('Administration CLI for Minecraft OnDemand')
    .version('0.0.1')

  return program
}
