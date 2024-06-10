import { z } from 'zod';
import { publishActions } from './constants';

export const MessageFormSchema = z.object({
  userId: z.string().min(1),
  text: z.string().trim().min(1),
});

export type MessageFormValues = z.infer<typeof MessageFormSchema>;

type PublishAction = (typeof publishActions)[keyof typeof publishActions];

export type Message = { id: number; date: string } & MessageFormValues;

export type DataToSend = {
  action: PublishAction;
  message: Message;
};
