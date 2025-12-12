/**
 * Socket.IO Client Stub
 * Optional real-time functionality - not yet implemented
 */

export function io(_url: string) {
  return {
    on: (_event: string, _handler: (...args: any[]) => void) => {},
    emit: (_event: string, ..._args: any[]) => {},
    disconnect: () => {},
    close: () => {},
  };
}

export type Socket = ReturnType<typeof io>;
