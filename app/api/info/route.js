import { NextResponse } from 'next/server';
import Eris from 'eris';

export async function POST(request) {
  try {
    const { userToken, sourceGuildId, targetGuildId, password } = await request.json();

    if (password !== process.env.NEXT_PUBLIC_API_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const ErisClient = typeof Eris === 'function' ? Eris : (Eris.Client || Eris);
    const client = new ErisClient(userToken, { getAllUsers: false });

    return new Promise((resolve) => {
      client.on('ready', async () => {
        try {
          const src = client.guilds.get(sourceGuildId);
          const tgt = client.guilds.get(targetGuildId);
          const user = client.user;

          const info = {
            user: {
              username: user.username,
              discriminator: user.discriminator,
              avatar: user.avatarURL
            },
            source: src ? {
              name: src.name,
              icon: src.iconURL,
              memberCount: src.memberCount,
              channels: src.channels.size,
              roles: src.roles.size
            } : null,
            target: tgt ? {
              name: tgt.name,
              icon: tgt.iconURL
            } : null
          };

          client.disconnect();
          resolve(NextResponse.json(info));
        } catch (err) {
          client.disconnect();
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        }
      });

      client.on('error', (err) => {
        client.disconnect();
        resolve(NextResponse.json({ error: 'Connection failed: ' + err.message }, { status: 500 }));
      });

      client.connect();
      
      // Timeout after 10s
      setTimeout(() => {
        client.disconnect();
        resolve(NextResponse.json({ error: 'Timeout' }, { status: 504 }));
      }, 10000);
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
