/**
 * Creates a bag of utils, wrapping up the given ns object into a nicer API.
 *
 * @param {NS} ns
 * @returns {Promise<Utils>}
 */
async function createUtils(ns) {
  const million = (x) => x * 1000000;

  const constants = {
    cost: {
      tor: million(0.2),
      bruteSSH: million(1),
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

  const sync = {
    getPlayerMoney: () => ns.getPlayer().money,

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
      if (sync.buyFTPCrack()) {
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
  };

  const async = {};

  const api = { sync, async };

  const print = (s) => ns.tprintf(s);
  const log = {
    info: (s) => print(s),
    warn: (s) => print(`[warn] ${s}`),
    error: (s) => print(`[error] ${s}`),
  };

  return { api, constants, log };
}

/**
 * Compiles a strategy. Compilation is required before it can be run.
 *
 * @param {Utils} utils
 * @param {Strategy} strategy
 * @returns {CompiledStrategy}
 */
function compileStrategy(utils, strategy) {
  return { utils, strategy };
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
  const compiled = compileStrategy(utils, strategy);
  await runStrategy(compiled);
}

/**
 * Runs a compiled stragey.
 *
 * @param {CompiledStrategy} compiled
 */
async function runStrategy(compiled) {
  const { strategy, utils } = compiled;
  const { log } = utils;

  const once = strategy.once;
  for (const key of Object.keys(once)) {
    const spec = once[key];
    const alreadyRun = await spec.verify();
    if (!alreadyRun) {
      continue;
    }
    const shouldRun = await spec.runWhen();
    if (!shouldRun) {
      continue;
    }
    await spec.run();
  }

  log.info('Running strategy');
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
