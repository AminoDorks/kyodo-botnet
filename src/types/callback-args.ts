export type EditProfileArgs = {
  nickname?: string;
  bio?: string;
  cover?: string;
  avatar?: string;
};

export type CircleIdArgs = {
  circleId: string;
};

export type ChatIdArgs = {
  chatId: string;
};

export type SendMessageArgs = {
  chatId: string;
  content: string;
  type: number;
};

export type DMArgs = {
  userId: string;
  initialMessage: string;
};

export type MakeOnlineArgs = {
  status: string;
};

export type UserIdArgs = {
  userId: string;
};

export type CreateChatArgs = {
  name: string;
  content: string;
  icon: string;
};

export type CreatePostArgs = {
  title: string;
  content: string;
  cover: string;
};
