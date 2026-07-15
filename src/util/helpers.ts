import { file } from 'bun';

import { PATHS, START_TOR_PORT } from '../constants';
import type { CachedCredentials, ProxyType } from '../types/helpers';

export const delay = async (seconds: number): Promise<void> =>
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const findTorProxies = async (): Promise<string[]> => {
  const matches = (await file(PATHS.torrc).text())
    .match(/SOCKSPort\s+(\d+)/g)
    ?.filter((port) => Number(port.split(' ')[1]) >= START_TOR_PORT);

  return matches ? matches.map((match) => `socks5://127.0.0.1:${match.split(' ')[1]}`) : [];
};

const findRotatedProxies = async (): Promise<string[]> =>
  (await file(PATHS.proxies).text()).split('\n').filter(Boolean);

export const findProxies = async (type: ProxyType): Promise<string[]> =>
  type === 'tor' ? await findTorProxies() : await findRotatedProxies();

export const findCachedCredentials = async (): Promise<CachedCredentials[]> =>
  Object.keys(await file(PATHS.cache).json()).map((key) => {
    const [email, password] = key.split(':');

    return { email: email!, password: password! };
  });
