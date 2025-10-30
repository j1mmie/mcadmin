import { Restart } from '../commands/restart.ts'
import { Start } from '../commands/start.ts'
import { Status } from '../commands/status.ts'
import { Stop } from '../commands/stop.ts'
import { TailWatchdog } from '../commands/tail-watchdog.ts'
import { Jumpbox } from '../commands/jumpbox/index.ts'
import { CommandManifest } from '../lib/command-loading.ts'

export const commands:CommandManifest = [
  Jumpbox,
  Status,
  Start,
  Restart,
  Stop,
  TailWatchdog
] as const
