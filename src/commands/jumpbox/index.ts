import { Command } from 'commander'
import { NestedCommandLoader } from "../../lib/command-loading.ts"
import { JumpboxStart } from "./start.ts"
import { JumpboxStop } from "./stop.ts"

const program = new Command()

program
  .command('project') // Re-using 'project' to add another subcommand
  .command('list')
  .description('List all projects')
  .action(() => {
    console.log('Listing projects...');
  })


export const Jumpbox: NestedCommandLoader = {
  parentName: 'jumpbox',
  manifest: [
    JumpboxStart,
    JumpboxStop
  ]
}