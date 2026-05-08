'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { content } from '@/lib/content';
import { translations } from '@/lib/translations';

export default function TermsPage() {
  const params = useParams();
  const lang = params?.lang || 'tr';
  const c = content[lang]?.terms || content.en.terms;
  const t = translations[lang] || translations.tr;

  return (
    <main>
      <div className="container content-page">
        <header>
          <h1>{c.title}</h1>
        </header>

        <div className="text-content">
          <p>{c.p1}</p>
          
          <h2>{c.h2_1}</h2>
          <p>{c.p2}</p>

          <h2>{c.h2_2}</h2>
          <p>{c.p3}</p>

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
