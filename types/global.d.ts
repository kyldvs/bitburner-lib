
import * as Types from './NetScriptDefinitions';

declare global {
  type NS = Types.NS;

  interface Utils {
    constants: {

    },

    log: {
      info: (s: string) => void,
      warn: (s: string) => void,
      error: (s: string) => void,
    },

    api: {

    },
  }

  interface Strategy {

  }

  interface CompiledStrategy {
    strategy: Strategy,
    utils: Utils,
  }
}
