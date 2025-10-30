#!/usr/bin/env bun

import { registerCommands } from './lib/command-loading.ts'
import { commands } from './program/command-list.ts'
import { setupProgram } from './program/setup-program.ts'

const program = setupProgram()
registerCommands(program, commands)
program.parse()
