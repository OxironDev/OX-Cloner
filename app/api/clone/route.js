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
  let isClosed = false;
  let decremented = false;
  let timeoutId;

  const cleanup = () => {
    if (!decremented) {
      activeClones--;
      decremented = true;
      console.log(`Active clones: ${activeClones}`);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
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
      timeoutId = setTimeout(() => {
        if (!isClosed) {
          send({ error: 'TIMEOUT' });
          isClosed = true;
          try {
            controller.close();
          } catch (e) {
            // Ignore if already closed
          }
          cleanup();
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
        isClosed = true;
        try {
          controller.close();
        } catch (e) {
          // Ignore if already closed
        }
        cleanup();
      }
    },
    cancel() {
      isClosed = true;
      cleanup();
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
