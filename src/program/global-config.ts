import fs from 'fs'
import os from 'os'
import path from 'path'
import { z } from 'zod'

const globalConfigSchema = z.object({
  awsProfile:        z.string(),
  region:            z.string(),
  clusterName:       z.string(),
  serviceName:       z.string(),
  gameContainerName: z.string(),
  sshInstanceId:     z.string(),
  sshKeyPath:        z.string(),
  gameHostName:      z.string(),
  javaPort:          z.number(),
  bedrockPort:       z.number(),
  watchDogLogGroupArn: z.string().optional(),
})

export type ConfigInterface = z.infer<typeof globalConfigSchema>

function loadGlobalConfig():ConfigInterface {
  const configPath = path.join(os.homedir(), '.mcadmin.json')
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`)
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

  const globalConfig = globalConfigSchema.parse(config)
  process.env.AWS_PROFILE = globalConfig.awsProfile

  return globalConfig
}

let globalConfigInstance:ConfigInterface | undefined

export function getGlobalConfig() {
  globalConfigInstance ??= loadGlobalConfig()
  return globalConfigInstance
}
