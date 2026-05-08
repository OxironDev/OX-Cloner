'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { guides } from '@/lib/guides_content';
import { translations } from '@/lib/translations';

export default function GuidesPage() {
  const params = useParams();
  const lang = params?.lang || 'tr';
  const gList = guides[lang] || guides.en;
  const t = translations[lang] || translations.tr;

  return (
    <main>
      <div className="container content-page">
        <header>
          <h1>{t.guidesTitle}</h1>
        </header>

        <div className="text-content">
          {gList.map((guide, index) => (
            <section key={index} style={{ marginBottom: '60px' }}>
              <h2>{guide.title}</h2>
              <p>{guide.content}</p>
            </section>
          ))}

          <div className="actions" style={{ marginTop: '80px' }}>
            <Link href={`/${lang}`}>
              <button>{t.goBack}</button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
