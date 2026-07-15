import type { KyodoDorks } from 'kyodo.dorks';

export type Callback<T> = (kyodo: KyodoDorks, args: T) => Promise<void>;

export type ProcessBulder = {
  callback: () => Promise<void>;
  logs: { success: string; error: string };
};
