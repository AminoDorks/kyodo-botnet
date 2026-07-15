import { KyodoDorks } from 'kyodo.dorks';

import { delay } from './helpers';
import { pool } from './tasks';
import { CONCURRENCIES } from '../constants';
import type { Callback } from '../types/callbacks';

export const proxies = async (rawProxies: string[]): Promise<string[]> => {
  const proxies: string[] = [];

  await pool<string>(
    rawProxies,
    async (proxy: string) => {
      const kyodo = new KyodoDorks({ enableLogging: true });
      kyodo.proxy = proxy;

      if (await kyodo.healthcheck()) {
        proxies.push(proxy);
        console.log(`Proxy connected: ${proxy}`);

        return;
      }

      console.log(`Proxy connection failed: ${proxy}`);
    },
    CONCURRENCIES.proxy
  );

  if (!proxies.length) {
    console.log('No proxies connected');
    await delay(1);
  }

  console.log(`Connected proxies length: ${proxies.length}`);

  return proxies;
};

export const callbacks = async <T>(
  contexts: KyodoDorks[],
  callback: Callback<T>,
  args: T,
  delaySeconds: number = 0
): Promise<void> => {
  await pool<KyodoDorks>(
    contexts,
    async (kyodo: KyodoDorks) => {
      await callback(kyodo, args);
      await delay(delaySeconds);
    },
    CONCURRENCIES.callback
  );
};
