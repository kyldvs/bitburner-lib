// Check that we have the ram to purchase things. Each function needs 32gb.

const CommonStrategy = {
  /**
   * @param {Utils} utils
   */
  buyTor: ({ api, constants }) => {
    return {
      buyTor: {
        runWhen: () => api.sync.getPlayer().money > constants.cost.tor,
        verify: () => api.sync.hasTor(),
        run: () => api.sync.buyTor(),
      },
    };
  },

  /**
   * @param {Utils} utils
   */
  buyPrograms: ({ api, constants }) => {
    return {
      buyBruteSSH: {
        runWhen: () => api.sync.getPlayer().money > constants.cost.bruteSSH,
        verify: () => api.sync.hasBruteSSH(),
        run: () => api.sync.buyBruteSSH(),
      },

      buyFTPCrack: {
        runWhen: () => api.sync.getPlayer().money > constants.cost.ftpCrack,
        verify: () => api.sync.hasFTPCrack(),
        run: () => api.sync.buyFTPCrack(),
      },

      buyRelaySMTP: {
        runWhen: () => api.sync.getPlayer().money > constants.cost.relaySMTP,
        verify: () => api.sync.hasRelaySMTP(),
        run: () => api.sync.buyRelaySMTP(),
      },

      buyHTTPWorm: {
        runWhen: () => api.sync.getPlayer().money > constants.cost.httpWorm,
        verify: () => api.sync.hasHTTPWorm(),
        run: () => api.sync.buyHTTPWorm(),
      },

      buySQLInject: {
        runWhen: () => api.sync.getPlayer().money > constants.cost.sqlInject,
        verify: () => api.sync.hasSQLInject(),
        run: () => api.sync.buySQLInject(),
      },

      buyServerProfiler: {
        runWhen: () =>
          api.sync.getPlayer().money > constants.cost.serverProfiler,
        verify: () => api.sync.hasServerProfiler(),
        run: () => api.sync.buyServerProfiler(),
      },

      buyDeepScanV1: {
        runWhen: () => api.sync.getPlayer().money > constants.cost.deepScanV1,
        verify: () => api.sync.hasDeepScanV1(),
        run: () => api.sync.buyDeepScanV1(),
      },

      buyDeepScanV2: {
        runWhen: () => api.sync.getPlayer().money > constants.cost.deepScanV2,
        verify: () => api.sync.hasDeepScanV2(),
        run: () => api.sync.buyDeepScanV2(),
      },

      buyAutoLink: {
        runWhen: () => api.sync.getPlayer().money > constants.cost.autoLink,
        verify: () => api.sync.hasAutoLink(),
        run: () => api.sync.buyAutoLink(),
      },

      buyFormulas: {
        runWhen: () => api.sync.getPlayer().money > constants.cost.formulas,
        verify: () => api.sync.hasFormulas(),
        run: () => api.sync.buyFormulas(),
      },
    };
  },
};

export default CommonStrategy;
