// Example Websocket API for Bridg + Pulse
// Translate to your language / framework of choice
import { PrismaClient } from '@prisma/client';
import { withPulse } from '@prisma/extension-pulse';
import { handleRequest } from 'bridg/server/request-handler';
import { NextApiHandler } from 'next';
import { NextWebSocketHandler } from 'next-plugin-websocket';
import { rules } from 'prisma/rules';

const PULSE_API_KEY = process.env.PULSE_API_KEY || '';

const db = new PrismaClient().$extends(withPulse({ apiKey: PULSE_API_KEY })) as unknown as PrismaClient;

export const socket: NextWebSocketHandler = (ws) => {
  let subscriptions: any[] = [];
  ws.on('close', () => {
    console.log('connection closed, stopping subscriptions');

    subscriptions.forEach((s) => s?.subscription?.stop());
  });

  ws.on('message', async function message(data: string) {
    const incomingMsg = JSON.parse(data);
    const request = incomingMsg.payload;

    const reply = (replyPayload: {}) => ws.send(JSON.stringify({ id: incomingMsg.id, payload: replyPayload }));

    if (request.func === 'unsubscribe') {
      console.log('stopping subscription');

      subscriptions
        .splice(
          subscriptions.findIndex((s) => s.id === incomingMsg.id),
          1,
        )
        .at(0)
        ?.subscription?.stop();
    } else {
      console.log('incoming request', request);

      const res = await handleRequest(request, {
        rules,
        uid: '',
        db,
        onSubscriptionCreated: (subscription) => {
          console.log('subscription created!!!');
          subscriptions.push({ id: incomingMsg.id, subscription });
        },
        onSubscriptionEvent: (newData) => {
          console.log('subscription event', newData);

          reply(newData);
        },
      });
      request.func !== 'subscribe' && reply(res);
    }
  });
};

// You still need to expose a regular HTTP handler, even if you only intend to
// use this API route for WebSocket connections.
const handler: NextApiHandler = (req, res) => {
  res.status(426).send('Upgrade Required');
};

export default handler;
