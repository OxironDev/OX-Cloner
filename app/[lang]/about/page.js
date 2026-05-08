'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { content } from '@/lib/content';
import { translations } from '@/lib/translations';

export default function AboutPage() {
  const params = useParams();
  const lang = params?.lang || 'tr';
  const c = content[lang]?.about || content.en.about;
  const t = translations[lang] || translations.tr;

  return (
    <main>
      <div className="container content-page">
        <header>
          <h1>{c.title}</h1>
        </header>

        <div className="text-content">
          <p>{c.p1}</p>
          <p>{c.p2}</p>
          
          <h2>{c.h2}</h2>
          <ul>
            <li>{c.li1}</li>
            <li>{c.li2}</li>
            <li>{c.li3}</li>
          </ul>

          <div className="actions" style={{ marginTop: '50px' }}>
            <Link href={`/${lang}`}>
              <button>{t.goBack}</button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
