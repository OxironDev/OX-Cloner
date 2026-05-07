import Eris from 'eris';
import delay from 'delay';
import fetch from 'node-fetch';
import { translations } from './translations';

async function fetchBuffer(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.buffer();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Clones a guild.
 */
async function cloneGuild(userToken, config, onProgress = () => { }) {
  const lang = config.lang || 'tr';
  const t = translations[lang];
  const DEFAULT_DELAY = config.rateLimitDelay || 1000;
  const MAX_CONSECUTIVE_ERRORS = 3;

  const client = new Eris(userToken, {
    restMode: true,
    gateway: { intents: ["guilds"] }
  });

  return new Promise((resolve, reject) => {
    let hasResponded = false;

    // Safety timeout for connection
    const connectionTimeout = setTimeout(() => {
      if (!hasResponded) {
        hasResponded = true;
        client.disconnect();
        reject(new Error(t.errorInvalidToken));
      }
    }, 15000); // 15s connection timeout

    client.on('error', (err) => {
      if (!hasResponded && (err.message.includes('Unauthorized') || err.message.includes('Login'))) {
        hasResponded = true;
        clearTimeout(connectionTimeout);
        client.disconnect();
        return reject(new Error(t.errorInvalidToken));
      }
      console.error('Eris error:', err);
    });

    client.on('ready', async () => {
      if (hasResponded) return;
      hasResponded = true;
      clearTimeout(connectionTimeout);
      try {
        await delay(2000);
        const src = client.guilds.get(config.sourceGuildId);
        const tgt = client.guilds.get(config.targetGuildId);

        if (!src || !tgt) {
          client.disconnect();
          return reject(new Error(lang === 'tr' ? 'Kaynak veya hedef sunucu bulunamadı.' : 'Source or target server not found.'));
        }

        // PERMISSION CHECK: Check if the user has Admin on the target guild
        // Eris: tgt.permissions.has('administrator') or check tgt.members.get(client.user.id)
        const me = tgt.members.get(client.user.id);
        if (!me || !me.permissions.has('administrator')) {
          client.disconnect();
          return reject(new Error(t.errorNoAdmin));
        }

        onProgress({ message: t.statusStarting, progress: 0 });

        const srcRoles = Array.from(src.roles.values()).sort((a, b) => b.position - a.position);
        const srcChannels = Array.from(src.channels.values());
        const srcEmojis = Array.from(src.emojis);

        // CLEANUP
        if (config.resetTargetServer) {
          onProgress({ message: t.statusCleaning, progress: 5 });

          onProgress({ message: t.statusCleaningChannels });
          for (const ch of Array.from(tgt.channels.values())) {
            try { await client.deleteChannel(ch.id); } catch (err) { }
            await delay(DEFAULT_DELAY);
          }

          onProgress({ message: t.statusCleaningRoles });
          for (const r of Array.from(tgt.roles.values())) {
            if (r.id === tgt.id || r.managed) continue;
            try { await client.deleteRole(tgt.id, r.id); } catch (err) { }
            await delay(DEFAULT_DELAY);
          }

          onProgress({ message: t.statusCleaningEmojis });
          for (const emoji of Array.from(tgt.emojis)) {
            try { await client.deleteGuildEmoji(tgt.id, emoji.id); } catch (err) { }
            await delay(DEFAULT_DELAY);
          }
        }

        // UPDATE GUILD
        onProgress({ message: t.statusUpdatingGuild, progress: 10 });
        try {
          const editData = { name: src.name };
          if (src.iconURL) {
            const iconBuffer = await fetchBuffer(src.iconURL);
            editData.icon = `data:image/png;base64,${iconBuffer.toString('base64')}`;
          }
          await client.editGuild(tgt.id, editData);
        } catch (e) { }

        // CREATE ROLES
        onProgress({ message: t.statusCreatingRoles, progress: 20 });
        const roleMap = new Map();
        roleMap.set(src.id, tgt.id);

        for (const r of srcRoles) {
          if (r.id === src.id || r.managed) continue;
          try {
            const role = await client.createRole(tgt.id, {
              name: r.name,
              color: r.color,
              hoist: r.hoist,
              permissions: r.permissions.allow || r.permissions,
              mentionable: r.mentionable
            });
            roleMap.set(r.id, role.id);
          } catch (e) { }
          await delay(DEFAULT_DELAY);
        }

        // CREATE CATEGORIES
        onProgress({ message: t.statusCreatingCategories, progress: 40 });
        const categoryMap = new Map();
        const categories = srcChannels.filter(c => c.type === 4).sort((a, b) => a.position - b.position);

        for (const c of categories) {
          try {
            const permissionOverwrites = Array.from(c.permissionOverwrites.values()).map(o => ({
              id: roleMap.get(o.id) || o.id,
              type: o.type,
              allow: o.allow.allow || o.allow,
              deny: o.deny.deny || o.deny
            }));
            const channel = await client.createChannel(tgt.id, c.name, 4, { permissionOverwrites });
            categoryMap.set(c.id, channel.id);
          } catch (e) { }
          await delay(DEFAULT_DELAY);
        }

        // CREATE CHANNELS
        onProgress({ message: t.statusCreatingChannels, progress: 60 });
        const channels = srcChannels.filter(c => c.type !== 4).sort((a, b) => a.position - b.position);

        for (const c of channels) {
          try {
            const permissionOverwrites = Array.from(c.permissionOverwrites.values()).map(o => ({
              id: roleMap.get(o.id) || o.id,
              type: o.type,
              allow: o.allow.allow || o.allow,
              deny: o.deny.deny || o.deny
            }));
            const type = c.type === 5 ? 0 : c.type;
            await client.createChannel(tgt.id, c.name, type, {
              parentID: c.parentID ? categoryMap.get(c.parentID) : undefined,
              topic: c.topic,
              nsfw: c.nsfw,
              permissionOverwrites
            });
          } catch (e) { }
          await delay(DEFAULT_DELAY);
        }

        // CREATE EMOJIS
        let consecutiveErrors = 0;
        const totalEmojis = srcEmojis.length;
        if (totalEmojis > 0) {
          for (let i = 0; i < totalEmojis; i++) {
            const e = srcEmojis[i];
            onProgress({ message: t.statusCreatingEmojis.replace('{current}', i + 1).replace('{total}', totalEmojis), progress: 80 });
            try {
              const emojiUrl = `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? 'gif' : 'png'}`;
              const emojiBuffer = await fetchBuffer(emojiUrl);
              await client.createGuildEmoji(tgt.id, {
                name: e.name,
                image: `data:image/${e.animated ? 'gif' : 'png'};base64,${emojiBuffer.toString('base64')}`
              });
              consecutiveErrors = 0;
            } catch (err) {
              consecutiveErrors++;
              if (consecutiveErrors >= 3) break;
            }
            await delay(DEFAULT_DELAY * 2);
          }
        }

        onProgress({ message: t.statusDone, progress: 100 });
        onProgress({ message: 'DONE' });
        client.disconnect();
        resolve();
      } catch (err) {
        client.disconnect();
        reject(err);
      }
    });

    client.connect();
  });
}

export { cloneGuild };
