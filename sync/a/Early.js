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
        // ...CommonStrategy.buyPrograms(utils),
        // ...CommonStrategy.buyTor(utils),
      },

      loop: {
        printStatus: {
          runForever: true,
          runInterval: constants.time.minuteMS * 2,
          run: async () => {
            // Print things like next step. Servers to backdoor. Exes to buy.
            // Server ram available. Etc. Etc.
            log.info(` > Status: TODO`);
          },
        },

        buyServers: {
          runUntil: async () => {
            const servers = await api.async.getPurchasedServers();
            return (
              servers.length === constants.purchased.maxCount &&
              !servers.some(
                (server) => server.ram.max < constants.purchased.maxRAM,
              )
            );
          },

          run: async () => {
            const stages = constants.purchased.stages;
            const counts = stages.map(() => 0);
            const targetCount = 4;
            const servers = await api.async.getPurchasedServers();

            // Find current stage.
            let curr = -1;
            let minValue = -1;
            let minServer = -1;
            for (let i = 0; i < servers.length; i++) {
              const server = servers[i];
              for (let j = 0; j < stages.length; j++) {
                if (server.ram.max === stages[j]) {
                  counts[j]++;
                  curr = Math.max(curr, j);
                  if (minValue === -1 || j < minValue) {
                    minValue = j;
                    minServer = i;
                  }
                }
              }
            }

            const shouldIncrease =
              curr < stages.length - 1 && counts[curr] < targetCount;
            const next = shouldIncrease ? curr + 1 : curr;

            const prefix = next === stages.length - 1 ? 'max' : 'stage' + next;
            const cost = api.sync.getServerCost(stages[next]);
            const player = api.sync.getPlayer();
            if (player.money > cost * 1.1) {
              let number = servers.length;
              if (servers.length >= constants.purchased.maxCount) {
                if (minServer === -1) {
                  log.warn(`Need to free server, but didn't find any.`);
                  return;
                }
                number = parseInt(servers[minServer].name.split('-')[1], 10);
                const deleted = api.sync.killAndDeleteServer(
                  servers[minServer],
                );
                if (!deleted) {
                  log.warn(`Failed deleting: ${servers[minServer].name}`);
                  return;
                }
              }
              const name = prefix + '-' + number;
              const bought = api.sync.buyServer(name, stages[next]);
              if (!bought) {
                log.warn(`Failed to buy server: ${name}`);
              }
            }
          },
        },

        // upgradeHomeServer: {},

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
                const result = api.sync.nuke(server);
              }
            }
          },
        },

        // Randomly grow, weaken and hack servers.
        randomHacking: {
          runForever: true,
          run: async () => {
            const target = await api.async.getRandomTarget();

            const threads = 1024 * 4;
            const idealMoneyPercent = 0.5;

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
