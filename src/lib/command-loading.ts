import { Command } from 'commander'

export type CommandLoader = (program:Command) => void

export type CommandManifest = Array<CommandLoader | NestedCommandLoader>

export type NestedCommandLoader = {
  parentName:string,
  manifest:CommandManifest
}

export function registerCommands(program:Command, manifest:CommandManifest) {
  for (const item of manifest) {

    if (typeof(item) === 'function') {
      // item is a CommandLoader
      item(program)
    } else {
      // item is a nested CommandManifest
      const parentCommand = program.command(item.parentName)
      registerCommands(parentCommand, item.manifest)
    }
  }
}
