import type { KyodoDorks } from 'kyodo.dorks';

import type {
  EditProfileArgs,
  CircleIdArgs,
  ChatIdArgs,
  DMArgs,
  SendMessageArgs,
  MakeOnlineArgs,
  UserIdArgs,
  CreatePostArgs,
  CreateChatArgs,
} from '../types/callback-args';
import type { ProcessBulder } from '../types/callbacks';

const process = async ({ callback, logs }: ProcessBulder): Promise<void> => {
  try {
    await callback();
    console.log(`[${new Date().toISOString()}] ${logs.success}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${logs.error}`, error);
  }
};

export const editProfileCallback = async (
  kyodo: KyodoDorks,
  args: EditProfileArgs
): Promise<void> => {
  await process({
    callback: async () => {
      await kyodo.user.edit({ ...args });
    },
    logs: {
      success: 'Profile updated successfully',
      error: 'Failed to update profile',
    },
  });
};

export const joinCircleCallback = async (
  kyodo: KyodoDorks,
  { circleId }: CircleIdArgs
): Promise<void> => {
  await process({
    callback: async () => {
      await kyodo.circle.join(circleId);
    },
    logs: {
      success: 'Joined circle successfully',
      error: 'Failed to join circle',
    },
  });
};

export const leaveCircleCallback = async (
  kyodo: KyodoDorks,
  { circleId }: CircleIdArgs
): Promise<void> => {
  await process({
    callback: async () => {
      await kyodo.circle.leave(circleId);
    },
    logs: {
      success: 'Left circle successfully',
      error: 'Failed to leave circle',
    },
  });
};

export const joinChatCallback = async (
  kyodo: KyodoDorks,
  { chatId }: ChatIdArgs
): Promise<void> => {
  await process({
    callback: async () => {
      await kyodo.chat.join(chatId);
    },
    logs: {
      success: 'Joined chat successfully',
      error: 'Failed to join chat',
    },
  });
};

export const leaveChatCallback = async (
  kyodo: KyodoDorks,
  { chatId }: ChatIdArgs
): Promise<void> => {
  await process({
    callback: async () => {
      await kyodo.chat.leave(chatId);
    },
    logs: {
      success: 'Left chat successfully',
      error: 'Failed to leave chat',
    },
  });
};

export const DMCallback = async (
  kyodo: KyodoDorks,
  { userId, initialMessage }: DMArgs
): Promise<void> => {
  await process({
    callback: async () => {
      await kyodo.chat.create({ type: 0, inviteeUids: [userId], initialMessage });
    },
    logs: {
      success: 'Sent DM successfully',
      error: 'Failed to send DM',
    },
  });
};

export const sendMessageCallback = async (
  kyodo: KyodoDorks,
  args: SendMessageArgs
): Promise<void> => {
  await process({
    callback: async () => {
      await kyodo.chat.text(args);
    },
    logs: {
      success: 'Sent message successfully',
      error: 'Failed to send message',
    },
  });
};

export const makeOnlineCallback = async (
  kyodo: KyodoDorks,
  { status }: MakeOnlineArgs
): Promise<void> => {
  await process({
    callback: async () => {
      await kyodo.user.status(true, status);
    },
    logs: {
      success: 'Made user online successfully',
      error: 'Failed to make user online',
    },
  });
};

export const followCallback = async (kyodo: KyodoDorks, { userId }: UserIdArgs): Promise<void> => {
  await process({
    callback: async () => {
      await kyodo.user.follow(userId);
    },
    logs: {
      success: 'Followed user successfully',
      error: 'Failed to follow user',
    },
  });
};

export const createPostCallback = async (
  kyodo: KyodoDorks,
  args: CreatePostArgs
): Promise<void> => {
  await process({
    callback: async () => {
      await kyodo.post.create(args);
    },
    logs: {
      success: 'Created post successfully',
      error: 'Failed to create post',
    },
  });
};

export const createChatCallback = async (
  kyodo: KyodoDorks,
  args: CreateChatArgs
): Promise<void> => {
  await process({
    callback: async () => {
      await kyodo.chat.create({ ...args, type: 2 });
    },
    logs: {
      success: 'Created chat successfully',
      error: 'Failed to create chat',
    },
  });
};
