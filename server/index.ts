import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';

import {
  Message,
  MessageFormSchema,
  DataToSend,
  publishActions,
} from '../shared/types';
import { FRONTEND_DEV_URL, BACKEND_DEV_URL } from '../shared/constants';

const app = new Hono();
const topic = 'anonymous-room';

const { upgradeWebSocket, websocket } = createBunWebSocket();
const server = Bun.serve({
  fetch: app.fetch,
  port: BACKEND_DEV_URL.split(':')[2],
  websocket,
});

app.use(
  '*',
  cors({
    origin: FRONTEND_DEV_URL,
  })
);

const messages: Message[] = [];

const messagesRoute = app
  .get('/messages', (c) => {
    return c.json(messages);
  })
  .post(
    '/messages',
    zValidator('form', MessageFormSchema, (result, c) => {
      if (!result.success) {
        return c.json({ ok: false }, 400);
      }
    }),
    async (c) => {
      const param = c.req.valid('form');

      const message: Message = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        ...param,
      };

      const data: DataToSend = {
        action: publishActions.UPDATE_CHAT,
        message: message,
      };

      messages.push(message);
      server.publish(topic, JSON.stringify(data));

      return c.json({ ok: true });
    }
  )
  .delete('/messages/:id', (c) => {
    const messageId = parseInt(c.req.param('id'));
    const index = messages.findIndex((message) => message.id === messageId);

    if (index === -1) {
      return c.json({ ok: false, error: 'Message not found' }, 404);
    }

    const data: DataToSend = {
      action: publishActions.DELETE_CHAT,
      message: messages[index],
    };

    messages.splice(index, 1);
    server.publish(topic, JSON.stringify(data));

    return c.json({ ok: true });
  });

app.get(
  '/ws',
  upgradeWebSocket((_) => {
    return {
      onOpen(_, ws) {
        const rawWs = ws.raw as ServerWebSocket;
        rawWs.subscribe(topic);
        console.log(
          `WebSocket server opened and subscribed to topic '${topic}'`
        );
      },
      onClose(_, ws) {
        const rawWs = ws.raw as ServerWebSocket;
        rawWs.unsubscribe(topic);
        console.log(`WebSocket server unsubscribed from topic '${topic}'`);
      },
    };
  })
);

export default app;
export type AppType = typeof messagesRoute;
