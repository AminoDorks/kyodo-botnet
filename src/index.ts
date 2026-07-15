import { Botnet } from './client/botnet';

(async () => {
  const proxyType = prompt('Select proxy type (1=tor 2=socks)');

  await new Botnet(proxyType === '1' ? 'tor' : 'socks').run();
})();
