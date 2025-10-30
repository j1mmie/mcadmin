import net from 'net'

function tryConnectOnceTcp(hostname:string, port:number, timeoutSeconds:number):Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    socket.setTimeout(timeoutSeconds * 1000)

    socket.on('connect', () => {
      socket.end()
      resolve()
    })

    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error('Connection timed out'))
    })

    socket.on('error', (error) => {
      socket.destroy()
      reject(error)
    })

    socket.connect(port, hostname)
  })
}

export function pollServerUntilPortOpen(hostname:string, port:number, frequencySeconds:number, timeoutSecondsPerAttempt:number, beforeAttemptCallback:() => void):Promise<void> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        beforeAttemptCallback()
        await tryConnectOnceTcp(hostname, port, timeoutSecondsPerAttempt)
        clearInterval(interval)
        resolve()
      } catch (error) {
        console.warn('Connection attempt failed:', error)
      }
    }, frequencySeconds * 1000)
  })
}
