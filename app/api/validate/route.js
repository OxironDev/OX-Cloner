import Eris from 'eris';

export async function POST(request) {
  const body = await request.json();
  const { userToken, targetGuildId, password } = body;

  if (password !== process.env.NEXT_PUBLIC_API_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  const client = new Eris(userToken, {
    restMode: true,
    gateway: { intents: ["guilds"] }
  });

  return new Promise((resolve) => {
    let hasResponded = false;

    const timeout = setTimeout(() => {
      if (!hasResponded) {
        hasResponded = true;
        client.disconnect();
        resolve(new Response(JSON.stringify({ error: 'TOKEN_INVALID' }), { status: 401 }));
      }
    }, 10000);

    client.on('error', (err) => {
      if (!hasResponded && (err.message.includes('Unauthorized') || err.message.includes('Login'))) {
        hasResponded = true;
        clearTimeout(timeout);
        client.disconnect();
        resolve(new Response(JSON.stringify({ error: 'TOKEN_INVALID' }), { status: 401 }));
      }
    });

    client.on('ready', async () => {
      if (hasResponded) return;
      hasResponded = true;
      clearTimeout(timeout);

      const tgt = client.guilds.get(targetGuildId);
      if (!tgt) {
        client.disconnect();
        return resolve(new Response(JSON.stringify({ error: 'GUILD_NOT_FOUND' }), { status: 404 }));
      }

      const me = tgt.members.get(client.user.id);
      if (!me || !me.permissions.has('administrator')) {
        client.disconnect();
        return resolve(new Response(JSON.stringify({ error: 'NO_ADMIN' }), { status: 403 }));
      }

      client.disconnect();
      resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });

    client.connect();
  });
}
