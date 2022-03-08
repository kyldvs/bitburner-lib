/**
 * @param {NS} ns
 */
export async function main(ns) {
  const server = ns.args[0];
  if (server != null && typeof server == 'string') {
    await ns.weaken(server);
  }
}
