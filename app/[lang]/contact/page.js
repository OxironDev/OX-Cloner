'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { translations } from '@/lib/translations';

export default function ContactPage() {
  const params = useParams();
  const lang = params?.lang || 'tr';
  const t = translations[lang] || translations.tr;

  const contactContent = {
    tr: {
      p1: "Sorularınız veya iş birliği talepleriniz için bize ulaşabilirsiniz.",
      p2: "Destek ekibimize e-posta gönderin:",
      email: "support@oxirondev.com"
    },
    en: {
      p1: "You can reach us for your questions or collaboration requests.",
      p2: "Email our support team:",
      email: "support@oxirondev.com"
    },
    es: {
      p1: "Puede contactarnos para sus preguntas o solicitudes de colaboración.",
      p2: "Envíe un correo electrónico a nuestro equipo de soporte:",
      email: "support@oxirondev.com"
    },
    fr: {
      p1: "Vous pouvez nous contacter pour vos questions ou demandes de collaboration.",
      p2: "Envoyez un e-mail à notre équipe de support :",
      email: "support@oxirondev.com"
    },
    de: {
      p1: "Sie können uns für Ihre Fragen oder Kooperationsanfragen erreichen.",
      p2: "Senden Sie eine E-Mail an unser Support-Team:",
      email: "support@oxirondev.com"
    },
    pt: {
      p1: "Você pode nos contatar para suas dúvidas ou solicitações de colaboração.",
      p2: "Envie um e-mail para nossa equipe de suporte:",
      email: "support@oxirondev.com"
    },
    it: {
      p1: "Puoi contattarci per le tue domande o richieste di collaborazione.",
      p2: "Invia un'e-mail al nostro team di supporto:",
      email: "support@oxirondev.com"
    }
  };

  const c = contactContent[lang] || contactContent.en;

  return (
    <main>
      <div className="container content-page">
        <header>
          <h1 style={{ textAlign: 'center' }}>{t.contactTitle}</h1>
        </header>

        <div className="text-content" style={{ textAlign: 'center' }}>
          <p>{c.p1}</p>
          <p style={{ marginTop: '30px', fontWeight: 'bold' }}>{c.p2}</p>
          <a href={`mailto:${c.email}`} style={{ color: 'var(--foreground)', fontSize: '1.2rem', textDecoration: 'none', borderBottom: '1px solid var(--foreground)' }}>
            {c.email}
          </a>

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
