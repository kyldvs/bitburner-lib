/**
 * Simple queue implementation using 2 stacks. Amortized O(1) operations.
 */
class Queue {
  constructor() {
    this._a = [];
    this._b = [];
  }

  getSize() {
    const a = this._a;
    const b = this._b;
    return a.length + b.length;
  }

  addLast(el) {
    const b = this._b;
    b.push(el);
  }

  getFirst() {
    const a = this._a;
    const b = this._b;
    if (a.length > 0) {
      return a[a.length - 1];
    }
    if (b.length > 0) {
      return b[0];
    }
    return undefined;
  }

  removeFirst() {
    const a = this._a;
    const b = this._b;
    if (a.length + b.length === 0) {
      return undefined;
    }
    if (a.length === 0) {
      while (b.length > 0) {
        const next = b.pop();
        if (next == null) {
          break;
        }
        a.push(next);
      }
    }
    return a.pop();
  }
}

/**
 * @param {number} max
 * @returns {Array<number>}
 */
const getPurchasedRAMStages = (max) => {
  const stages = [64];
  while (stages[stages.length - 1] < max) {
    stages.push(stages[stages.length - 1] * 4);
  }
  while (stages[stages.length - 1] > max) {
    stages.pop();
  }
  if (stages[stages.length - 1] !== max) {
    stages.push(max);
  }
  return stages;
};

/**
 * Creates a bag of utils, wrapping up the given ns object into a nicer API.
 *
 * @param {NS} ns
 * @returns {Promise<Utils>}
 */
async function createUtils(ns) {
  const million = (x) => x * 1000000;

  /**
   * @type {Constants}
   */
  const constants = {
    // The minimum mount of money a server's max money should be in order to
    // be considered a valid target.
    minTargetMoney: 100,
    minWorkerRAM: 4,
    // The amount of RAM needed before excluding non-purchased servers.
    minWorkerPoolRAM: 1024 * 32,

    purchased: {
      maxRAM: ns.getPurchasedServerMaxRam(),
      maxCount: ns.getPurchasedServerLimit(),
      stages: getPurchasedRAMStages(ns.getPurchasedServerMaxRam()),
    },

    script: {
      growTarget: '/a/target/GrowTarget.js',
      hackTarget: '/a/target/HackTarget.js',
      weakenTarget: '/a/target/WeakenTarget.js',
    },

    cost: {
      tor: million(0.2),
      bruteSSH: million(1), // TODO: Confirm this price. Might be 0.5.
      ftpCrack: million(1.5),
      relaySMTP: million(5),
      httpWorm: million(30),
      sqlInject: million(250),
      serverProfiler: million(0.5),
      deepScanV1: million(0.5),
      deepScanV2: million(25),
      autoLink: million(1),
      formulas: million(5000),
    },

    time: {
      minuteMS: 1000 * 60,
    },

    quality: {
      invalid: 0,
      low: 25,
      medium: 50,
      high: 75,
      perfect: 100,
    },
  };

  const random = {
    /**
     * @param {number} min
     * @param {number} max
     * @returns number
     */
    int: (min, max) => {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min) + min);
    },
  };

  /**
   * @param {string} name
   * @returns {Server}
   */
  const getServer = (name) => {
    const server = ns.getServer(name);
    return {
      name: name,
      isRoot: server.hasAdminRights,
      isPurchased: server.purchasedByPlayer,
      isHome: name === 'home',

      hack: {
        required: server.requiredHackingSkill,
      },

      ports: {
        open: server.openPortCount,
        required: server.numOpenPortsRequired,
      },

      money: {
        min: 0,
        curr: server.moneyAvailable,
        max: server.moneyMax,
      },

      difficulty: {
        min: 0,
        curr: server.hackDifficulty,
        max: 100,
        start: server.baseDifficulty,
      },

      cores: server.cpuCores,
      ram: {
        used: server.ramUsed,
        max: server.maxRam,
        reserve: name === 'home' ? 16 : 0,
      },
    };
  };

  let id = 1;
  const getNextID = () => {
    const x = id;
    id++;
    return String(x);
  };

  /**
   * Track running processes spawned so we can kill them later.
   *
   * @type {MyQueue<{host: string, pid: number}>}
   */
  const ps = new Queue();

  /**
   * @param {{pid: number} | undefined} process
   * @returns
   */
  const isRunning = (process) => {
    if (process == null) {
      return false;
    }
    const info = ns.getRunningScript(process.pid);
    return info != null;
  };

  /**
   * @param {string} host
   * @param {number} pid
   */
  const recordPID = (host, pid) => {
    ps.addLast({ host, pid });
  };

  const cleanPS = () => {
    while (ps.getSize() > 0 && !isRunning(ps.getFirst())) {
      ps.removeFirst();
    }
  };

  const killChildren = () => {
    while (ps.getSize() > 0) {
      const process = ps.removeFirst();
      if (process != null && isRunning(process)) {
        ns.kill(process.pid);
      }
    }
  };

  /**
   * @param {string} curr
   * @param {Set<string>} visited
   * @param {Array<Server>} result
   * @param {(s: Server) => boolean} filter
   * @returns {Promise<Array<Server>>}
   */
  const dfs = async (curr, visited, result, filter) => {
    if (visited.has(curr)) {
      return result;
    }
    visited.add(curr);
    const server = getServer(curr);
    if (filter(server)) {
      result.push(server);
    }
    const children = ns.scan(curr);
    for (const child of children) {
      dfs(child, visited, result, filter);
    }
    return result;
  };

  /**
   * @param {Server} server
   * @returns {number}
   */
  const getMaxRAM = (server) => {
    return Math.floor(Math.max(0, server.ram.max - server.ram.reserve));
  };

  /**
   * @param {Array<Server>} workers
   * @returns {number}
   */
  const sumMaxRAM = (workers) => {
    return workers.reduce((sum, server) => {
      return sum + getMaxRAM(server);
    }, 0);
  };

  /**
   * @param {Server} server
   * @returns {number}
   */
  const getAvailableRAM = (server) => {
    return Math.floor(
      Math.max(0, server.ram.max - server.ram.reserve - server.ram.used),
    );
  };

  /**
   * @param {Array<Server>} workers
   * @returns {number}
   */
  const sumAvailableRAM = (workers) => {
    return workers.reduce((sum, server) => {
      return sum + getAvailableRAM(server);
    }, 0);
  };

  /**
   * @returns {Promise<WorkerPool>}
   */
  const getWorkerPool = async () => {
    const possibleWorkers = await dfs('home', new Set(), [], (server) => {
      return server.isRoot && server.ram.max >= constants.minWorkerRAM;
    });

    // Can simplify this if home is "purchased". Double check that.
    const home = getServer('home');
    const purchased = possibleWorkers.filter(
      (server) => server.isPurchased && !server.isHome,
    );
    const others = possibleWorkers.filter(
      (server) => !server.isPurchased && !server.isHome,
    );

    // Avoid non purchased workers if we have enough RAM from other sources.
    // Not super important, this just keeps active scripts section cleaner.
    const workers = [home].concat(purchased);
    if (sumMaxRAM(workers) < constants.minWorkerPoolRAM) {
      workers.push(...others);
    }

    // Sorts workers in decending order of available RAM.
    function sortWorkers() {
      workers.sort((a, b) => {
        const ramA = getAvailableRAM(a);
        const ramB = getAvailableRAM(b);
        if (ramA < ramB) {
          return 1;
        } else if (ramB < ramA) {
          return -1;
        } else {
          return 0;
        }
      });
    }

    /**
     * @param {ExecOptions} options
     * @returns {Promise<boolean>}
     */
    const exec = async (options) => {
      // Make sure we got a valid script.
      if (!ns.fileExists(options.script, 'home')) {
        return false;
      }

      sortWorkers();

      // Make a copy in case something else changes the order. That would be
      // bad if possible though...
      const workerCopy = workers.slice(0);

      const scriptCost = ns.getScriptRam(options.script, 'home');

      let threads = options.threads;

      // How to distribute exec calls to workers.
      const distribution = workerCopy.map((worker) => {
        const ram = getAvailableRAM(worker);
        const possible = Math.floor(ram / scriptCost);
        const toRun = Math.max(0, Math.min(threads, possible));
        threads -= toRun;
        // Not necessary, but defensive.
        threads = Math.max(threads, 0);
        return toRun;
      });

      // Track execs that need work.
      const needsWork = distribution.map((threads) => threads > 0);

      // 5 attempts to prevent infinite loop.
      let execAttempts = 0;
      while (execAttempts < 5) {
        execAttempts++;

        let hasMoreWork = false;
        for (let i = 0; i < workerCopy.length; i++) {
          if (!needsWork[i]) {
            continue;
          }

          const worker = workerCopy[i];

          // Setup worker.
          await ns.scp(options.script, worker.name);
          if (!ns.fileExists(options.script, worker.name)) {
            hasMoreWork = true;
            continue;
          }

          const threads = distribution[i];
          // Add a probably unique id to the end. Exec fails given same server,
          // script, and args.
          const args = options.args.concat([getNextID()]);
          const pid = ns.exec(options.script, worker.name, threads, ...args);
          if (pid === 0) {
            hasMoreWork = true;
            continue;
          } else {
            needsWork[i] = false;
            recordPID(worker.name, pid);
          }
        }

        // Small delay to let things propogate if there is more work.
        if (hasMoreWork) {
          await ns.asleep(1);
        } else {
          break;
        }
      }

      // Cleanup any processes that might have finished.
      cleanPS();

      // If anything needs work, we failed to exec everything. Return false.
      return !needsWork.some((b) => b);
    };

    const pool = {
      exec,
    };

    return pool;
  };

  const sync = {
    /**
     * @returns {Player}
     */
    getPlayer: () => {
      const player = ns.getPlayer();

      return {
        money: player.money,
        hackSkill: player.hacking,
      };
    },

    /**
     * @param {Server} server
     * @returns boolean
     */
    canNuke: (server) => {
      if (server.isRoot || server.isPurchased) {
        return false;
      }

      const player = ns.getPlayer();
      const hackLevel = player.hacking;

      let openable = 0;
      if (sync.hasBruteSSH()) {
        openable++;
      }
      if (sync.hasFTPCrack()) {
        openable++;
      }
      if (sync.hasRelaySMTP()) {
        openable++;
      }
      if (sync.hasHTTPWorm()) {
        openable++;
      }
      if (sync.hasSQLInject()) {
        openable++;
      }

      const hasHack = hackLevel >= server.hack.required;
      const hasPorts = openable >= server.ports.required;
      return hasHack && hasPorts;
    },

    /**
     * TODO: Figure out behavior if you don't have requirements. Does it launch
     * an alert? Or fail silently?
     *
     * @param {Server} server
     * @returns void
     */
    nuke: (server) => {
      if (sync.hasBruteSSH()) {
        ns.brutessh(server.name);
      }
      if (sync.hasFTPCrack()) {
        ns.ftpcrack(server.name);
      }
      if (sync.hasRelaySMTP()) {
        ns.relaysmtp(server.name);
      }
      if (sync.hasHTTPWorm()) {
        ns.httpworm(server.name);
      }
      if (sync.hasSQLInject()) {
        ns.sqlinject(server.name);
      }
      ns.nuke(server.name);
    },

    hasTor: () => ns.getPlayer().tor,
    buyTor: () => ns.purchaseTor(),
    hasBruteSSH: () => ns.fileExists('BruteSSH.exe', 'home'),
    buyBruteSSH: () => ns.purchaseProgram('BruteSSH.exe'),
    hasFTPCrack: () => ns.fileExists('FTPCrack.exe', 'home'),
    buyFTPCrack: () => ns.purchaseProgram('FTPCrack.exe'),
    hasRelaySMTP: () => ns.fileExists('RelaySMTP.exe', 'home'),
    buyRelaySMTP: () => ns.purchaseProgram('RelaySMTP.exe'),
    hasHTTPWorm: () => ns.fileExists('HTTPWorm.exe', 'home'),
    buyHTTPWorm: () => ns.purchaseProgram('HTTPWorm.exe'),
    hasSQLInject: () => ns.fileExists('SQLInject.exe', 'home'),
    buySQLInject: () => ns.purchaseProgram('SQLInject.exe'),
    hasServerProfiler: () => ns.fileExists('ServerProfiler.exe', 'home'),
    buyServerProfiler: () => ns.purchaseProgram('ServerProfiler.exe'),
    hasDeepScanV1: () => ns.fileExists('DeepScanV1.exe', 'home'),
    buyDeepScanV1: () => ns.purchaseProgram('DeepScanV1.exe'),
    hasDeepScanV2: () => ns.fileExists('DeepScanV2.exe', 'home'),
    buyDeepScanV2: () => ns.purchaseProgram('DeepScanV2.exe'),
    hasAutoLink: () => ns.fileExists('AutoLink.exe', 'home'),
    buyAutoLink: () => ns.purchaseProgram('AutoLink.exe'),
    hasFormulas: () => ns.fileExists('Formulas.exe', 'home'),
    buyFormulas: () => ns.purchaseProgram('Formulas.exe'),

    killChildren,

    getServerCost: (gb) => {
      return ns.getPurchasedServerCost(gb);
    },

    buyServer: (name, gb) => {
      const newName = ns.purchaseServer(name, gb);
      return newName !== '';
    },

    /**
     * @param {Server} server
     * @returns {boolean}
     */
    killAndDeleteServer: (server) => {
      // I don't think this is possible, but let's be safe.
      if (server.isHome) {
        log.warn(`Attempted to delete home. Aborting.`);
        return false;
      }

      ns.killall(server.name);
      return ns.deleteServer(server.name);
    },
  };

  const async = {
    getAllServers: async () => {
      const servers = await dfs('home', new Set(), [], () => true);
      return servers;
    },

    getPurchasedServers: async () => {
      const servers = await dfs('home', new Set(), [], (server) => {
        return server.isPurchased && !server.isHome;
      });
      return servers;
    },

    getRandomTarget: async () => {
      const servers = await async.getAllServers();
      const targets = servers.filter(
        (server) =>
          server.isRoot &&
          !server.isPurchased &&
          server.money.max >= constants.minTargetMoney,
      );
      const index = random.int(0, targets.length);
      return targets[index];
    },

    /**
     * @param {Server} server
     * @param {GrowQualityOptions | undefined} options
     * @returns number
     */
    getGrowQuality: async (server, options) => {
      // Min difficulty and max money is always perfect.
      if (
        server.difficulty.curr <= server.difficulty.min &&
        server.money.curr >= server.money.max
      ) {
        return constants.quality.perfect;
      }

      // Can't do anything on a max difficulty server.
      if (server.difficulty.curr >= server.difficulty.max) {
        return constants.quality.invalid;
      }

      // Can't grow at max money.
      if (server.money.curr >= server.money.max) {
        return constants.quality.invalid;
      }

      // If the difficulty is really high, then it's a bad target.
      if (server.difficulty.curr >= 0.75 * server.difficulty.max) {
        return constants.quality.low;
      }

      const argPct = options?.idealMoneyPercent;
      const pct = argPct == null ? 1 : Math.min(Math.max(argPct, 0), 1);
      const targetMoney = server.money.max * pct;

      // We already have more than target money, this is just a medium match.
      if (server.money.curr >= targetMoney) {
        return constants.quality.medium;
      }

      // We don't have enough money yet, this is a high quality match.
      if (server.money.curr < targetMoney) {
        return constants.quality.high;
      }

      // Unreachable, we've already exhausted all possibillities.
      return constants.quality.invalid;
    },

    /**
     * @param {Server} server
     * @param {WeakenQualityOptions | undefined} options
     * @returns number
     */
    getWeakenQuality: async (server, options) => {
      // Already at min, nothing to do.
      if (server.difficulty.curr <= server.difficulty.min) {
        return constants.quality.invalid;
      }

      // Not min, perfect candidate. Should we be more discerning?
      if (server.difficulty.curr > server.difficulty.min) {
        return constants.quality.perfect;
      }

      // Unreachable.
      return constants.quality.invalid;
    },

    /**
     * @param {Server} server
     * @param {HackQualityOptions | undefined} options
     * @returns number
     */
    getHackQuality: async (server, options) => {
      // Min difficulty and max money is always perfect.
      if (
        server.difficulty.curr <= server.difficulty.min &&
        server.money.curr >= server.money.max
      ) {
        return constants.quality.perfect;
      }

      // Can't do anything on a max difficulty server.
      if (server.difficulty.curr >= server.difficulty.max) {
        return constants.quality.invalid;
      }

      // Can't hack at min money.
      if (server.money.curr <= server.money.min) {
        return constants.quality.invalid;
      }

      // If the difficulty is really high, then it's a bad target.
      if (server.difficulty.curr >= 0.75 * server.difficulty.max) {
        return constants.quality.low;
      }

      const argPct = options?.idealMoneyPercent;
      const pct = argPct == null ? 1 : Math.min(Math.max(argPct, 0), 1);
      const targetMoney = server.money.max * pct;

      // We don't have target money yet, this is just a medium match.
      if (server.money.curr < targetMoney) {
        return constants.quality.medium;
      }

      // We have target money, this is a high quality match.
      if (server.money.curr >= targetMoney) {
        return constants.quality.high;
      }

      // Unreachable, we've already exhausted all possibillities.
      return constants.quality.invalid;
    },

    /**
     * @param {Server} server
     * @param {GrowOptions} options
     * @returns {Promise<boolean>}
     */
    grow: async (server, options) => {
      const workerPool = await getWorkerPool();
      const result = await workerPool.exec({
        script: constants.script.growTarget,
        threads: options.threads,
        args: [server.name],
      });
      return result;
    },

    /**
     * @param {Server} server
     * @param {WeakenOptions} options
     * @returns {Promise<boolean>}
     */
    weaken: async (server, options) => {
      const workerPool = await getWorkerPool();
      const result = await workerPool.exec({
        script: constants.script.weakenTarget,
        threads: options.threads,
        args: [server.name],
      });
      return result;
    },

    /**
     * @param {Server} server
     * @param {HackOptions} options
     * @returns {Promise<boolean>}
     */
    hack: async (server, options) => {
      const workerPool = await getWorkerPool();
      const result = await workerPool.exec({
        script: constants.script.hackTarget,
        threads: options.threads,
        args: [server.name],
      });
      return result;
    },
  };

  const api = { sync, async };

  const print = (s) => ns.tprintf(s);
  const log = {
    info: (s) => print(s),
    warn: (s) => print(`[warn] ${s}`),
    error: (s) => print(`[error] ${s}`),
  };

  return { api, constants, log, random };
}

/**
 * Compiles a strategy. Compilation is required before it can be run.
 *
 * @param {NS} ns
 * @param {Utils} utils
 * @param {Strategy} strategy
 * @returns {CompiledStrategy}
 */
function compileStrategy(ns, utils, strategy) {
  return { ns, utils, strategy };
}

/**
 * Creates and runs a given strategy.
 *
 * @param {NS} ns
 * @param {(utils: Utils) => Strategy} fn
 * @return {Promise<void>}
 */
async function createAndRun(ns, fn) {
  const utils = await createUtils(ns);
  const strategy = fn(utils);
  const compiled = compileStrategy(ns, utils, strategy);
  await runStrategy(compiled);
}

/**
 * Runs a compiled stragey.
 *
 * @param {CompiledStrategy} compiled
 */
async function runStrategy(compiled) {
  const { ns, strategy, utils } = compiled;
  const { api, log } = utils;

  const onceSpecs = Object.keys(strategy.once).map((key) => ({
    ...strategy.once[key],
    name: key,
  }));
  const once = {
    specs: onceSpecs,
    done: onceSpecs.map(() => false),
    last: onceSpecs.map(() => 0),
    allDone: false,
  };

  const runOnce = async () => {
    if (once.allDone) {
      return;
    }

    let allDone = true;
    for (let i = 0; i < once.specs.length; i++) {
      if (once.done[i]) {
        continue;
      }

      const spec = once.specs[i];
      const done = await spec.verify();
      if (done) {
        once.done[i] = true;
        log.info(` > Once done: ${spec.name}`);
        continue;
      }

      allDone = false;

      const shouldRun = await spec.runWhen();
      if (!shouldRun) {
        continue;
      }

      const now = Date.now();
      once.last[i] = now;
      await spec.run();
    }
    once.allDone = allDone;
  };

  const loopSpecs = Object.keys(strategy.loop).map((key) => {
    const spec = strategy.loop[key];
    if (spec.runForever) {
      return {
        name: key,
        // Setting to 0 will end up using clock speed, no additional delay.
        interval: spec.runInterval == null ? 0 : spec.runInterval,
        done: () => false,
        run: spec.run,
      };
    } else {
      return {
        name: key,
        // Setting to 0 will end up using clock speed, no additional delay.
        interval: spec.runInterval == null ? 0 : spec.runInterval,
        done: spec.runUntil == null ? () => false : spec.runUntil,
        run: spec.run,
      };
    }
  });

  const loop = {
    specs: loopSpecs,
    done: onceSpecs.map(() => false),
    last: onceSpecs.map(() => 0),
  };

  const runLoop = async () => {
    for (let i = 0; i < loop.specs.length; i++) {
      if (loop.done[i]) {
        continue;
      }

      const spec = loop.specs[i];
      const done = await spec.done();
      if (done) {
        loop.done[i] = true;
        log.info(` > Loop done: ${spec.name}`);
        continue;
      }

      const now = Date.now();
      const delay = now - loop.last[i];
      if (delay < spec.interval) {
        continue;
      }

      loop.last[i] = now;
      await spec.run();
    }
  };

  log.info(`Starting strategy: ${compiled.strategy.name}`);

  // Can add an option to prevent this in the future.
  const killChildrenAtExit = true;
  ns.atExit(() => {
    log.info(`Exiting strategy: ${compiled.strategy.name}`);
    if (killChildrenAtExit) {
      log.info(` > Killing Child Processes`);
      api.sync.killChildren();
    }
  });

  let lastRun = 0;
  while (true) {
    lastRun = Date.now();

    await runOnce();
    await runLoop();

    // Figure out necessary delay. Minimum 1ms.
    const delay = Date.now() - lastRun;
    const remaining = Math.max(1, compiled.strategy.config.clockMS - delay);
    await ns.asleep(remaining);
  }
}

const Strategy = {
  createAndRun,
};

export default Strategy;

// Commands to interact with this strategy. Send data over the specified port as
// as single string joined by $
//
// Send single string:
//    "stop$arg1$arg2"
// Which calls the "stop" function listed in commands:
//    stop(["arg1", "arg2"])
// commands: {
//   port: 1,

//   stop: async (args) => {
//     await api.async.stopSelfAndChildren();
//   },
// },
let _idea = 1;
