import amqplib, { Channel, Connection, ConsumeMessage } from 'amqplib';

export const EXCHANGE = 'food.events';
// Durable queue so messages survive a realtime-service restart
const QUEUE = 'realtime.notifications';

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  connection = await amqplib.connect(url);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  // Assert the queue then bind it to the exchange with '#' — matches every routing key
  // so realtime-service receives all events published to food.events
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, '#');

  // Process one message at a time — prevents socket.io from being flooded
  channel.prefetch(1);
  console.log('[rabbitmq] connected — listening on queue:', QUEUE);
}

export async function startConsuming(
  handler: (routingKey: string, payload: unknown) => void,
): Promise<void> {
  if (!channel) throw new Error('[rabbitmq] channel not ready — call connectRabbitMQ first');

  channel.consume(QUEUE, (msg: ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const routingKey = msg.fields.routingKey;
      const payload = JSON.parse(msg.content.toString()) as unknown;
      handler(routingKey, payload);
      channel!.ack(msg); // tell RabbitMQ the message was processed
    } catch (err) {
      // nack without requeue so a malformed message doesn't loop forever
      channel!.nack(msg, false, false);
      console.error('[rabbitmq] failed to process message', err);
    }
  });
}
