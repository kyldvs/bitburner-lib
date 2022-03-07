import Strategy from 'a/Strategy.js';

/**
 * @param {NS} ns
 */
export async function main(ns) {
  await Strategy.createAndRun(ns, ({ api, constants, log }) => ({
    name: `Early Game`,
    description: `Getting through the early game. Randomly hack targets.`,

    config: {
      clockMS: 16,
    },

    // Commands to interact with this strategy. Send data over the specified port as
    // as single string joined by $
    //
    // Send single string:
    //    "stop$arg1$arg2"
    // Which calls the "stop" function listed in commands:
    //    stop(["arg1", "arg2"])
    commands: {
      port: 1,

      stop: async (args) => {
        await api.async.stopSelfAndChildren();
      },
    },

    once: {
      // Buy tor network as soon as possible.
      buyTor: {
        verify: () => api.sync.getPlayerHasTor(),
        runWhen: () => api.sync.getPlayerMoney() > constants.torCost,
        run: () => api.sync.buyTor(),
      },

      // Can this be automated?
      buyExes: {},
    },

    loop: {
      printStatus: {
        runForever: true,
        runInterval: constants.time.minuteMS * 2,
        run: async () => {
          // Print things like next step. Servers to backdoor. Exes to buy.
          // Server ram available. Etc. Etc.
          log.info(`====== Hello ======`);
        },
      },

      upgradeHomeServer: {},

      buyServers: {
        runForever: true,
        run: async () => {
          // TODO: Figure out what this api looks like.
          return null;
        },
      },

      // Nuke all servers until they are all root.
      nuke: {
        runUntil: async () => {
          const allServers = await api.async.getAllServers();
          return allServers.every((server) => server.isRoot);
        },

        runInterval: constants.time.minuteMS * 5,
        run: async () => {
          // Manually nuke and print info here.
          await api.async.nukeAll();
        },
      },

      // Randomly grow, weaken and hack servers.
      randomHacking: {
        runForever: true,

        run: async () => {
          const target = await api.async.getRandomTarget();

          const threads = 4;
          const idealMoneyPercent = 0.05;

          const growQuality = await api.async.getGrowQuality(target, {
            idealMoneyPercent,
          });
          if (growQuality > constants.quality.medium) {
            await api.async.grow(target, { threads });
          }

          const weakenQuality = await api.async.getWeakenQuality(target);
          if (weakenQuality > constants.quality.medium) {
            await api.async.weaken(target, { threads: 4 });
          }

          const hackQuality = await api.async.getHackQuality(target, {
            idealMoneyPercent,
          });
          if (hackQuality > constants.quality.medium) {
            await api.async.hack(target, { threads });
          }
        },
      },

      // Buy hacknet servers.
      buyHacknet: {
        runUntil: () => {
          // Until hacknet node cost exceeds a certain amount, or we have a certain amount?
          return false;
        },

        runInterval: constants.time.minuteMS,
        run: async () => {
          // Buy 3 basic hacknet stuff immediately at start for early game.
          // Then incrementally upgrade to 9 max servers.
          // After hitting 9 buy a complete server and max upgrades when can do it in one shot with X% of money.
          return null;
        },
      },

      // Play the stock market when it's available.
      playStockMarket: {
        runForever: true,
        run: async () => {
          return null;
        },
      },
    },
  }));
}
