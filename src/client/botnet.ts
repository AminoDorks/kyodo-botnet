import { file } from 'bun';
import { type Chat, KyodoDorks } from 'kyodo.dorks';

import raw from '../../raw.json';
import { delay, findCachedCredentials, findProxies } from '../util/helpers';
import { many, pool } from '../util/tasks';
import { callbacks } from '../util/pools';
import {
  createChatCallback,
  createPostCallback,
  DMCallback,
  editProfileCallback,
  followCallback,
  joinChatCallback,
  joinCircleCallback,
  leaveChatCallback,
  leaveCircleCallback,
  makeOnlineCallback,
  sendMessageCallback,
} from './callbacks';
import { ACTIONS, BATCHES, CONCURRENCIES, PATHS } from '../constants';
import type { CachedCredentials, ProxyType } from '../types/helpers';
import type { ParsingResult } from '../types/botnet';

export class Botnet {
  private proxies: string[] = [];
  private contexts: KyodoDorks[] = [];

  private proxyType: ProxyType;
  private instance: KyodoDorks;

  constructor(proxyType: ProxyType) {
    this.proxyType = proxyType;
    this.instance = new KyodoDorks();
  }

  private parseCircle = async (): Promise<string> => {
    return (await this.instance.linkResolution(prompt('Circle url: ')!)).circleId;
  };

  private parseObject = async (object: string): Promise<ParsingResult> => {
    const { circleId, objectId } = await this.instance.linkResolution(prompt(`${object} url: `)!);
    return { circleId, objectId };
  };

  private fillContexts = async (): Promise<void> => {
    const credentials = (await file(PATHS.cache).exists()) ? await findCachedCredentials() : raw;

    console.log(`Filling contexts with ${credentials.length} units`);

    await many<string, CachedCredentials>(
      this.proxies,
      credentials,
      BATCHES.contexts,
      async (proxy: string, credentials: CachedCredentials[]) => {
        await delay(1);
        await pool<CachedCredentials>(
          credentials,
          async (credential: CachedCredentials) => {
            const kyodo = new KyodoDorks();
            kyodo.proxy = proxy;
            try {
              await delay(1);
              await kyodo.auth.login(credential.email, credential.password);
              this.contexts.push(kyodo);

              console.log(`[${credential.email}][${proxy}] - prepared`);
            } catch (e) {
              console.log(`[${credential.email}][${proxy}] - error`, e);
            }
          },
          credentials.length
        );
      }
    );

    this.instance = this.contexts[0]!;

    console.log(`Filled ${this.contexts.length} contexts`);
  };

  private joinCircle = async (): Promise<void> => {
    const circleId = await this.parseCircle();

    await callbacks(this.contexts, joinCircleCallback, { circleId });
  };

  private leaveCircle = async (): Promise<void> => {
    const circleId = await this.parseCircle();

    await callbacks(this.contexts, leaveCircleCallback, { circleId });
  };

  private joinChat = async (): Promise<void> => {
    const { circleId, objectId } = await this.parseObject('Chat');

    await callbacks(this.contexts, joinChatCallback, { circleId, chatId: objectId });
  };

  private leaveChat = async (): Promise<void> => {
    const { circleId, objectId } = await this.parseObject('Chat');

    await callbacks(this.contexts, leaveChatCallback, { circleId, chatId: objectId });
  };

  private sendText = async (): Promise<void> => {
    const { circleId, objectId } = await this.parseObject('Chat');
    const content = prompt('Message: ')!;

    const circledContexts = this.contexts.map((context) => context.as(circleId));

    await callbacks(circledContexts, sendMessageCallback, { chatId: objectId, content, type: 0 });
  };

  private sendImage = async (): Promise<void> => {
    const { circleId, objectId } = await this.parseObject('Chat');
    const path = prompt('Image path: ')!;
    const content = await this.instance.upload(path, 'chat/message', 'image/jpg');

    const circledContexts = this.contexts.map((context) => context.as(circleId));

    await callbacks(circledContexts, sendMessageCallback, { chatId: objectId, content, type: 2 });
  };

  private startDM = async (): Promise<void> => {
    const { circleId, objectId } = await this.parseObject('User');
    const initialMessage = prompt('Message: ')!;

    const circledContexts = this.contexts.map((context) => context.as(circleId));

    await callbacks(circledContexts, DMCallback, { userId: objectId, initialMessage, type: 0 });
  };

  private startDMAll = async (): Promise<void> => {
    const circleId = await this.parseCircle();
    const initialMessage = prompt('Message: ')!;

    const inviteeUids = (
      await this.instance.as(circleId).user.many({ size: 50, type: 'online' })
    ).map((user) => user.uid);

    const circledContexts = this.contexts.map((context) => context.as(circleId));

    await pool<string>(
      inviteeUids,
      async (userId) => {
        await callbacks(circledContexts, DMCallback, {
          userId,
          initialMessage,
          type: 0,
        });
      },
      10
    );
  };

  private editProfile = async (): Promise<void> => {
    const circleId = await this.parseCircle();
    const nickname = prompt('Nickname: ') || undefined;
    const avatarPath = prompt('Avatar path: ');
    const coverPath = prompt('Cover path: ');
    const bio = prompt('Bio: ') || undefined;

    const avatar = avatarPath
      ? await this.instance.upload(avatarPath, 'user/avatar', 'image/jpg')
      : undefined;
    const cover = coverPath
      ? await this.instance.upload(coverPath, 'user/cover', 'image/jpg')
      : undefined;

    const circledContexts = this.contexts.map((context) => context.as(circleId));

    await callbacks(circledContexts, editProfileCallback, { nickname, avatar, cover, bio });
  };

  private makeOnline = async (): Promise<void> => {
    const circleId = await this.parseCircle();
    const status = prompt('Message: ')!;

    const circledContexts = this.contexts.map((context) => context.as(circleId));

    await callbacks(circledContexts, makeOnlineCallback, { status });
  };

  private followUser = async (): Promise<void> => {
    const { circleId, objectId } = await this.parseObject('User');

    const circledContexts = this.contexts.map((context) => context.as(circleId));

    await callbacks(circledContexts, followCallback, { userId: objectId });
  };

  private followAll = async (): Promise<void> => {
    const circleId = await this.parseCircle();

    const userIds = (await this.instance.as(circleId).user.many({ size: 50, type: 'online' })).map(
      (user) => user.uid
    );

    const circledContexts = this.contexts.map((context) => context.as(circleId));

    await pool<string>(
      userIds,
      async (userId) => {
        await callbacks(circledContexts, followCallback, { userId });
      },
      CONCURRENCIES.follow
    );
  };

  private createPost = async (): Promise<void> => {
    const circleId = await this.parseCircle();

    const title = prompt('Post title: ')!;
    const content = prompt('Post content: ')!;
    const cover = await this.instance.upload(prompt('Post cover')!, 'post/gallery', 'image/jpg');

    const circledContexts = this.contexts.map((context) => context.as(circleId));
    await callbacks(circledContexts, createPostCallback, { title, content, cover });
  };

  private createChat = async (): Promise<void> => {
    const circleId = await this.parseCircle();

    const name = prompt('Chat name: ')!;
    const content = prompt('Chat content: ')!;
    const icon = await this.instance.upload(prompt('Chat cover')!, 'chat/icon', 'image/jpg');

    const circledContexts = this.contexts.map((context) => context.as(circleId));

    await callbacks(circledContexts, createChatCallback, { name, content, icon });
  };

  private raidAllChats = async (): Promise<void> => {
    const circleId = await this.parseCircle();

    const chats = (await this.instance.as(circleId).chat.many()).chatList;
    const content = prompt('Message: ')!;

    const circledContexts = this.contexts.map((context) => context.as(circleId));

    await pool<Chat>(
      chats,
      async (chat) => {
        await callbacks(circledContexts, joinChatCallback, { chatId: chat.id });
        await callbacks(circledContexts, sendMessageCallback, {
          chatId: chat.id,
          content,
          type: 0,
        });
      },
      chats.length
    );
  };

  public run = async (): Promise<void> => {
    this.proxies = await findProxies(this.proxyType);
    await this.fillContexts();

    while (true) {
      console.log(ACTIONS.join('\n'));

      const action = prompt('Choose an action: ');

      if (!action) continue;

      switch (action) {
        case 'exit':
          return;
        case '1':
          await this.joinCircle();
          break;
        case '2':
          await this.leaveCircle();
          break;
        case '3':
          await this.joinChat();
          break;
        case '4':
          await this.leaveChat();
          break;
        case '5':
          await this.sendText();
          break;
        case '6':
          await this.sendImage();
          break;
        case '7':
          await this.startDM();
          break;
        case '8':
          await this.startDMAll();
          break;
        case '9':
          await this.editProfile();
          break;
        case '10':
          await this.makeOnline();
          break;
        case '11':
          await this.followUser();
          break;
        case '12':
          await this.followAll();
          break;
        case '13':
          await this.createPost();
          break;
        case '14':
          await this.createChat();
          break;
        case '15':
          await this.raidAllChats();
          break;
      }
    }
  };
}
