/**
 * Creates a bag of utils, wrapping up the given ns object into a nicer API.
 *
 * @param {NS} ns
 * @returns {Promise<Utils>}
 */
async function createUtils(ns) {
  const api = {};
  const constants = {};

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
  log.info('Running strategy');
}

const Strategy = {
  createAndRun,
};

export default Strategy;
