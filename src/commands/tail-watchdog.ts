import { CommandLoader } from '../lib/command-loading'
import { getGlobalConfig } from '../program/global-config'
import { CloudWatchLogsClient, DescribeLogStreamsCommand, GetLogEventsCommand, StartLiveTailCommand, StartLiveTailCommandOutput } from '@aws-sdk/client-cloudwatch-logs'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year:   'numeric',
  month:  'short',
  day:    'numeric',
  hour:   'numeric',
  minute: 'numeric',
  second: 'numeric',
})

function systemLog(event:{timestamp?:number | undefined, message?:string | undefined}) {
  const timestamp = event.timestamp
  let dateStr = ''
  if (timestamp === undefined) {
    dateStr = 'Unknown'
  } else {
    const date = new Date(timestamp)
    dateStr = dateFormatter.format(date)
  }

  console.log(`[${dateStr}] ${event.message}`)
}

async function handleResponseAsync(response:StartLiveTailCommandOutput) {
  if (!response.responseStream) {
    throw new Error('No response stream in the response object')
  }

  try {
    for await (const event of response.responseStream) {
      if (event.sessionStart) {
        console.log(`-- History displayed above. Waiting for live messages... --`)
      } else if (event.sessionUpdate) {
        if (!event.sessionUpdate.sessionResults) {
          continue
        }

        for (const logEvent of event.sessionUpdate.sessionResults) {
          systemLog(logEvent)
        }
      } else {
          console.error('Unknown event type')
      }
    }
  } catch (err) {
    console.error(err)
  }
}

async function perform() {
  const logGroupArn = getGlobalConfig().watchDogLogGroupArn
  if (!logGroupArn) {
    throw new Error('watchDogLogGroupArn is not defined in the global config')
  }

  const client = new CloudWatchLogsClient({
    region: getGlobalConfig().region
  })

  // First get the most recent log stream name
  const logStreams = await client.send(new DescribeLogStreamsCommand({
    logGroupIdentifier: logGroupArn,
  }))

  if (!logStreams.logStreams) {
    throw new Error('Log streams not found')
  }

  if (logStreams.logStreams.length === 0) {
    throw new Error('Log streams not found')
  }

  const sortedLogStreams = logStreams.logStreams.sort((a, b) => {
    if (!a.creationTime || !b.creationTime) {
      return 0
    }

    return a.creationTime - b.creationTime
  })

  const mostRecentLogStream = sortedLogStreams[sortedLogStreams.length - 1]

  console.log(`-- Most recent log stream: ${mostRecentLogStream.logStreamName} --`)

  const historyCmd = new GetLogEventsCommand({
    logGroupIdentifier: logGroupArn,
    logStreamName: mostRecentLogStream.logStreamName,
    limit: 100,
  })

  const response = await client.send(historyCmd)

  for (const event of response.events ?? []) {
    systemLog(event)
  }

  const command = new StartLiveTailCommand({
    logGroupIdentifiers: [ logGroupArn ],
  })

  try {
      const response = await client.send(command)
      handleResponseAsync(response)
  } catch (err){
      // Pre-stream exceptions are captured here
      console.log(err)
  }
}

export const TailWatchdog:CommandLoader = (program) => {
  program
    .command('tail-watchdog')
    .action(perform)
}
