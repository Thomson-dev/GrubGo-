import amqplib, { Channel, Connection } from 'amqplib';

// All services use the same exchange name — topic type lets us route by pattern
export const EXCHANGE = 'food.events';

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  connection = await amqplib.connect(url);
  channel = await connection.createChannel();
  // durable: true — exchange survives a RabbitMQ restart
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  console.log('[rabbitmq] connected — exchange:', EXCHANGE);
}

// Serialize payload and push to the exchange with the given routing key.
// Fire-and-forget: if channel isn't ready we log a warning and move on
// so a RabbitMQ outage never crashes the main request flow.
export function publishEvent(routingKey: string, payload: object): void {
  if (!channel) {
    console.warn('[rabbitmq] channel not ready — skipping publish:', routingKey);
    return;
  }
  channel.publish(
    EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }, // message survives a broker restart
  );
}
