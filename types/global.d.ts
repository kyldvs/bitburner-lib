
import * as Types from './NetScriptDefinitions';

declare global {
  type NS = Types.NS;

  interface Server {
    name: string;
    isRoot: boolean;
    isPurchased: boolean;

    hack: {
      required: number;
    };

    ports: {
      open: number;
      required: number;
    };
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

  interface Utils {
    constants: {
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
    };

    log: {
      info: (s: string) => void;
      warn: (s: string) => void;
      error: (s: string) => void;
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

      };

      async: {
        getAllServers: () => Promise<Array<Server>>;
        getRandomTarget: () => Promise<Server>;

        getGrowQuality: (server: Server, options?: GrowQualityOptions) => Promise<number>;
        getWeakenQuality: (server: Server, options?: WeakenQualityOptions) => Promise<number>;
        getHackQuality: (server: Server, options?: HackQualityOptions) => Promise<number>;

        grow: (server: Server, options: GrowOptions) => Promise<void>;
        weaken: (server: Server, options: WeakenOptions) => Promise<void>;
        hack: (server: Server, options: HackOptions) => Promise<void>;

        nuke: (server: Server) => Promise<boolean>;
      };
    };
  }

  interface SpecOnce {
    verify: () => Promise<boolean> | boolean;
    runWhen: () => Promise<boolean> | boolean;
    run: () => Promise<any> | any;
  }

  interface SpecLoop {
    runForever?: boolean;
    runInterval?: number;
    runUntil?: () => Promise<boolean> | boolean;
    run: () => Promise<any> | any;
  }

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
  }
}
