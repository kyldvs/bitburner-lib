import CommonStrategy from 'a/CommonStrategy.js';
import Strategy from 'a/Strategy.js';

/**
 * @param {NS} ns
 */
export async function main(ns) {
  await Strategy.createAndRun(ns, (utils) => {
    const { api, constants, log } = utils;
    return {
      name: `Early Game`,
      description: `Getting through the early game. Randomly hack targets.`,

      config: {
        clockMS: 16,
      },

      once: {
        ...CommonStrategy.buyThingsOnce(utils),
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

        // upgradeHomeServer: {},
        // buyServers: {},

        // Nuke all servers until they are all root.
        nuke: {
          runUntil: async () => {
            const allServers = await api.async.getAllServers();
            return allServers.every((server) => server.isRoot);
          },

          runInterval: constants.time.minuteMS,
          run: async () => {
            const allServers = await api.async.getAllServers();
            for (const server of allServers) {
              if (api.sync.canNuke(server)) {
                const result = await api.async.nuke(server);
              }
            }
            // TODO: Print results, or defer to status?
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
              await api.async.weaken(target, { threads });
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
            return;
          },
        },

        // Play the stock market when it's available.
        playStockMarket: {
          runForever: true,
          run: async () => {
            return;
          },
        },
      },
    };
  });
}
