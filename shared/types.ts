import { z } from 'zod';

export const MessageFormSchema = z.object({
  userId: z.string().min(1),
  text: z.string().trim().min(1),
});

export type MessageFormValues = z.infer<typeof MessageFormSchema>;

export const publishActions = {
  UPDATE_CHAT: 'UPDATE_CHAT',
  DELETE_CHAT: 'DELETE_CHAT',
} as const;

type PublishAction = (typeof publishActions)[keyof typeof publishActions];

export type Message = { id: number; date: string } & MessageFormValues;

export type DataToSend = {
  action: PublishAction;
  message: Message;
};
