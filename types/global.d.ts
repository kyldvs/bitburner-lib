
import * as Types from './NetScriptDefinitions';

declare global {
  type NS = Types.NS;

  interface MyQueue<T> {
    getSize: () => number;
    addLast: (el: T) => void;
    removeFirst: () => T | undefined;
    getFirst: () => T | undefined;
  }

  interface Server {
    name: string;
    isRoot: boolean;
    isPurchased: boolean;
    isHome: boolean;

    hack: {
      required: number;
    };

    ports: {
      open: number;
      required: number;
    };

    money: {
      min: number;
      curr: number;
      max: number;
    };

    difficulty: {
      min: number;
      curr: number;
      max: number;
      start: number;
    };

    cores: number;
    ram: {
      used: number;
      max: number;
      reserve: number;
    }
  }

  interface GrowOptions {
    threads: number;
  }

  interface WeakenOptions {
    threads: number;
  }

  interface HackOptions {
    threads: number;
  }

  interface GrowQualityOptions {
    idealMoneyPercent?: number;
  }

  interface WeakenQualityOptions {

  }

  interface HackQualityOptions {
    idealMoneyPercent?: number;
  }

  interface ExecOptions {
    script: string,
    threads: number,
    args: Array<string>,
  }

  interface WorkerPool {
    exec: (options: ExecOptions) => Promise<boolean>;
  }

  interface Constants {
    minTargetMoney: number;
    minWorkerRAM: number;
    minWorkerPoolRAM: number;

    script: {
      growTarget: string;
      hackTarget: string;
      weakenTarget: string;
    };

    cost: {
      tor: number;
      bruteSSH: number;
      ftpCrack: number;
      relaySMTP: number;
      httpWorm: number;
      sqlInject: number;
      serverProfiler: number;
      deepScanV1: number;
      deepScanV2: number;
      autoLink: number;
      formulas: number;
    };

    time: {
      minuteMS: number;
    };

    quality: {
      invalid: number,
      low: number;
      medium: number;
      high: number;
      perfect: number;
    };
  }

  interface Utils {
    constants: Constants;

    log: {
      info: (s: string) => void;
      warn: (s: string) => void;
      error: (s: string) => void;
    };

    random: {
      int: (min: number, max: number) => number;
    };

    api: {
      sync: {
        getPlayerMoney: () => number;

        canNuke: (server: Server) => boolean;
        nuke: (server: Server) => void;

        hasTor: () => boolean;
        buyTor: () => boolean;
        hasBruteSSH: () => boolean;
        buyBruteSSH: () => boolean;
        hasFTPCrack: () => boolean;
        buyFTPCrack: () => boolean;
        hasRelaySMTP: () => boolean;
        buyRelaySMTP: () => boolean;
        hasHTTPWorm: () => boolean;
        buyHTTPWorm: () => boolean;
        hasSQLInject: () => boolean;
        buySQLInject: () => boolean;
        hasServerProfiler: () => boolean;
        buyServerProfiler: () => boolean;
        hasDeepScanV1: () => boolean;
        buyDeepScanV1: () => boolean;
        hasDeepScanV2: () => boolean;
        buyDeepScanV2: () => boolean;
        hasAutoLink: () => boolean;
        buyAutoLink: () => boolean;
        hasFormulas: () => boolean;
        buyFormulas: () => boolean;

        killChildren: () => void;
      };

      async: {
        getAllServers: () => Promise<Array<Server>>;
        getRandomTarget: () => Promise<Server>;

        getGrowQuality: (server: Server, options?: GrowQualityOptions) => Promise<number>;
        getWeakenQuality: (server: Server, options?: WeakenQualityOptions) => Promise<number>;
        getHackQuality: (server: Server, options?: HackQualityOptions) => Promise<number>;

        grow: (server: Server, options: GrowOptions) => Promise<boolean>;
        weaken: (server: Server, options: WeakenOptions) => Promise<boolean>;
        hack: (server: Server, options: HackOptions) => Promise<boolean>;
      };
    };
  }

  interface SpecOnce {
    verify: () => Promise<boolean> | boolean;
    runWhen: () => Promise<boolean> | boolean;
    run: () => Promise<any> | any;
  }

  interface SpecLoopForever {
    runForever: true;
    runInterval?: number;
    run: () => Promise<any> | any;
  }

  interface SpecLoopUntil {
    runForever?: undefined;
    runInterval?: number;
    runUntil?: () => Promise<boolean> | boolean;
    run: () => Promise<any> | any;
  }

  type SpecLoop = SpecLoopForever | SpecLoopUntil;

  interface Strategy {
    name: string;
    description: string;

    config: {
      clockMS: number;
    };

    once: {
      [key: string]: SpecOnce;
    };

    loop: {
      [key: string]: SpecLoop;
    };
  }

  interface CompiledStrategy {
    strategy: Strategy;
    utils: Utils;
    ns: NS;
  }
}
