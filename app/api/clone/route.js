import { NextResponse } from 'next/server';
import { cloneGuild } from '@/lib/cloner';

let activeClones = 0;
const MAX_CONCURRENT_CLONES = 10;
const GLOBAL_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes safety timeout

export async function POST(request) {
  const body = await request.json();
  const { userToken, sourceGuildId, targetGuildId, resetTargetServer, password, lang } = body;

  if (activeClones >= MAX_CONCURRENT_CLONES) {
    return NextResponse.json({ error: 'OVERLOAD' }, { status: 429 });
  }

  if (password !== process.env.NEXT_PUBLIC_API_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  activeClones++;
  console.log(`Active clones: ${activeClones}`);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const send = (data) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch (e) {
            isClosed = true;
          }
        }
      };

      // Timeout logic
      const timeoutId = setTimeout(() => {
        if (!isClosed) {
          send({ error: 'TIMEOUT' });
          isClosed = true;
          controller.close();
        }
      }, GLOBAL_TIMEOUT_MS);

      try {
        await cloneGuild(userToken, {
          sourceGuildId,
          targetGuildId,
          resetTargetServer: resetTargetServer || false,
          lang: lang
        }, (progress) => {
          send(progress);
        });
      } catch (err) {
        send({ error: err.message });
      } finally {
        clearTimeout(timeoutId);
        if (!isClosed) {
          isClosed = true;
          activeClones--;
          console.log(`Clone finished. Active clones: ${activeClones}`);
          try { controller.close(); } catch (e) {}
        } else {
          // If already closed by timeout, we still need to decrement activeClones
          activeClones--;
          console.log(`Clone finished (already closed). Active clones: ${activeClones}`);
        }
      }
    },
    cancel() {
      console.log("Client disconnected, closing stream.");
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
