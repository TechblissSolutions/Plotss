'use client';
import React from 'react';
import Link from 'next/link';
import { T, useContent } from '../content';

/** Text the admin can edit under Admin → Content. Keep defaults free of apostrophes, quotes and ampersands. */

const Shell = ({ eyebrow, title, intro, children }: { eyebrow: React.ReactNode; title: React.ReactNode; intro?: React.ReactNode; children: React.ReactNode }) => (
  <main>
    <section className="bg-sand border-b border-line">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-stone">
          <Link href="/" className="hover:text-clay">Home</Link> <span aria-hidden>/</span> <span className="text-graphite">{eyebrow}</span>
        </nav>
        <h1 className="font-serif-headline text-4xl font-bold md:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-stone">{intro}</p>}
      </div>
    </section>
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">{children}</div>
  </main>
);

/** A link whose target (email, phone, WhatsApp number) comes from the admin Content editor. */
export function ContactLink({ k, def, kind }: { k: string; def: string; kind: 'mailto' | 'tel' | 'wa' }) {
  const { texts } = useContent();
  const v = (texts[k] || def).trim();
  const href = kind === 'mailto' ? `mailto:${v}` : kind === 'tel' ? `tel:${v.replace(/[^+\d]/g, '')}` : `https://wa.me/${v.replace(/\D/g, '')}`;
  return <a href={href} className="font-semibold text-clay underline-offset-2 hover:underline">{v}</a>;
}

const CTA = () => (
  <div className="mt-12 flex flex-wrap gap-3">
    <a href="/search" className="paint-graphite rounded-sm px-5 py-3 text-sm font-semibold text-ivory"><T k="page.cta.browse">Browse listings</T></a>
    <a href="/post-listing" className="rounded-sm border border-line px-5 py-3 text-sm font-semibold hover:border-clay"><T k="page.cta.post">Post a listing free</T></a>
  </div>
);

export function AboutPage() {
  const values: [string, string, string, string][] = [
    ['about.v1.t', 'Clear information', 'about.v1.d', 'Every listing shows size, price, location and land use in plain words. No guessing.'],
    ['about.v2.t', 'Direct contact', 'about.v2.d', 'Buyers reach owners without a long chain of middlemen. Contact details are shown only to signed-in buyers.'],
    ['about.v3.t', 'Safety checks', 'about.v3.d', 'Each listing goes through an automatic risk screen and is reviewed before it goes live.'],
  ];
  const stats: [string, string, string, string][] = [
    ['about.s1.n', '3', 'about.s1.l', 'Launch cities'],
    ['about.s2.n', '100%', 'about.s2.l', 'Listings screened'],
    ['about.s3.n', 'Free', 'about.s3.l', 'To post a listing'],
  ];
  return (
    <Shell eyebrow={<T k="about.crumb">About us</T>} title={<T k="about.title">About PLOTSS</T>} intro={<T k="about.intro">PLOTSS is a marketplace for land in India. We help owners list land and help buyers find it, starting with Ghaziabad, Noida and New Delhi.</T>}>
      <div className="grid gap-10 md:grid-cols-5">
        <div className="space-y-4 text-graphite md:col-span-3">
          <h2 className="font-serif-headline text-2xl font-bold"><T k="about.story.h">Why we built it</T></h2>
          <p><T k="about.story.p1">Buying land is one of the biggest decisions a family or a business makes. Yet the information is scattered, prices are unclear and it is hard to know who to trust.</T></p>
          <p><T k="about.story.p2">PLOTSS puts land listings in one place, explains each one in simple language, and checks it for warning signs before buyers see it.</T></p>
          <h2 className="font-serif-headline pt-4 text-2xl font-bold"><T k="about.mission.h">Our promise</T></h2>
          <p><T k="about.mission.p">We will keep the process honest and simple, so that a buyer, an owner and a broker all know what is happening at each step.</T></p>
        </div>
        <div className="grid grid-cols-3 gap-3 md:col-span-2 md:grid-cols-1">
          {stats.map(([nk, n, lk, l]) => (
            <div key={nk} className="rounded-md border border-line bg-white p-5 text-center md:text-left">
              <div className="font-serif-headline text-3xl font-bold text-clay"><T k={nk}>{n}</T></div>
              <div className="mt-1 text-sm text-stone"><T k={lk}>{l}</T></div>
            </div>
          ))}
        </div>
      </div>
      <h2 className="font-serif-headline mt-14 text-2xl font-bold"><T k="about.values.h">What we stand for</T></h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {values.map(([tk, t, dk, d]) => (
          <div key={tk} className="rounded-md border border-line bg-white p-6">
            <h3 className="font-serif-headline text-lg font-bold"><T k={tk}>{t}</T></h3>
            <p className="mt-2 text-sm text-stone"><T k={dk}>{d}</T></p>
          </div>
        ))}
      </div>
      <CTA />
    </Shell>
  );
}

export function ContactPage() {
  return (
    <Shell eyebrow={<T k="contact.crumb">Contact</T>} title={<T k="contact.title">Contact us</T>} intro={<T k="contact.intro">Questions about a listing, posting land or working with us? Write or call and we will get back within one working day.</T>}>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-md border border-line bg-white p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-clay"><T k="contact.email.h">Email</T></div>
          <p className="mt-2"><ContactLink k="contact.email" def="hello@plotss.in" kind="mailto" /></p>
        </div>
        <div className="rounded-md border border-line bg-white p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-clay"><T k="contact.phone.h">Phone</T></div>
          <p className="mt-2"><ContactLink k="contact.phone" def="+91 90000 00000" kind="tel" /></p>
        </div>
        <div className="rounded-md border border-line bg-white p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-clay"><T k="contact.wa.h">WhatsApp</T></div>
          <p className="mt-2"><ContactLink k="contact.whatsapp" def="+91 90000 00000" kind="wa" /></p>
        </div>
      </div>
      <div className="mt-8 rounded-md border border-line bg-sand p-6 text-sm text-graphite">
        <h2 className="font-serif-headline text-xl font-bold"><T k="contact.hours.h">Office hours</T></h2>
        <p className="mt-2"><T k="contact.hours.p">Monday to Saturday, 10 AM to 7 PM India time.</T></p>
        <p className="mt-2"><T k="contact.area.p">Serving Ghaziabad, Noida and New Delhi.</T></p>
      </div>
      <p className="mt-6 text-sm text-stone"><T k="contact.listing.note">To ask about one specific listing, open it and use the Enquire button so the owner gets your message directly.</T></p>
      <CTA />
    </Shell>
  );
}

const FAQ: [string, string, string, string][] = [
  ['faq.q1', 'Is it free to post a listing?', 'faq.a1', 'Yes. Posting a listing is free at launch. Every listing is checked before it goes live.'],
  ['faq.q2', 'How do I get the owner contact details?', 'faq.a2', 'Open a listing, sign in with Google or your phone number, and choose Unlock contact. There is a daily limit to protect owners from spam.'],
  ['faq.q3', 'What does AI-screened mean?', 'faq.a3', 'Our system reads the listing and flags warning signs such as unusual prices or missing details. It is a first check, not a legal guarantee.'],
  ['faq.q4', 'Are the documents verified?', 'faq.a4', 'At launch we do not collect documents online. Documents are normally shared after a direct meeting. Always check title papers with a lawyer before paying.'],
  ['faq.q5', 'Which cities do you cover?', 'faq.a5', 'We start with Ghaziabad, then Noida and New Delhi. More cities will follow.'],
  ['faq.q6', 'Can brokers use PLOTSS?', 'faq.a6', 'Broker features are coming soon. Until then, please post as an owner or contact us.'],
  ['faq.q7', 'How do I remove or change my listing?', 'faq.a7', 'Open your seller dashboard from the menu. You can see the status of each listing there. For changes, contact us and we will help.'],
  ['faq.q8', 'Is my phone number safe?', 'faq.a8', 'Yes. Contact details are kept private and are shown only to signed-in buyers, with daily limits.'],
];

export function FaqPage() {
  return (
    <Shell eyebrow={<T k="faq.crumb">FAQ</T>} title={<T k="faq.title">Frequently asked questions</T>} intro={<T k="faq.intro">Quick answers about buying, selling and how PLOTSS works.</T>}>
      <div className="divide-y divide-line rounded-md border border-line bg-white">
        {FAQ.map(([qk, q, ak, a]) => (
          <details key={qk} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              <T k={qk}>{q}</T>
              <span aria-hidden className="text-clay transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-stone"><T k={ak}>{a}</T></p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm text-stone"><T k="faq.more">Still have a question?</T> <a href="/contact" className="font-semibold text-clay hover:underline"><T k="faq.more.link">Contact us</T></a></p>
    </Shell>
  );
}

type Section = [string, string, string, string];
const LEGAL: Record<'terms' | 'privacy' | 'rera', { head: [string, string, string, string, string, string]; sections: Section[] }> = {
  terms: {
    head: ['terms.crumb', 'Terms of Service', 'terms.title', 'Terms of Service', 'terms.intro', 'Please read these terms before using PLOTSS. By using the site you agree to them.'],
    sections: [
      ['terms.s1.h', 'What PLOTSS is', 'terms.s1.p', 'PLOTSS is an online marketplace where owners list land and buyers find it. We are not a party to any sale and we do not act as a broker or lawyer unless we say so in writing.'],
      ['terms.s2.h', 'Your account', 'terms.s2.p', 'Give true details and keep your login safe. You are responsible for what happens under your account.'],
      ['terms.s3.h', 'Listings', 'terms.s3.p', 'Sellers must own the land or have written permission to list it, and must give accurate details. We may reject, edit or remove any listing that looks wrong or unsafe.'],
      ['terms.s4.h', 'Buying safely', 'terms.s4.p', 'Listing information is given by sellers. Always visit the site, check title papers and take legal advice before you pay any money.'],
      ['terms.s5.h', 'Not allowed', 'terms.s5.p', 'Do not post false listings, copy contact details in bulk, harass other users or try to break the site.'],
      ['terms.s6.h', 'Liability', 'terms.s6.p', 'PLOTSS gives information as it is provided to us and is not responsible for deals between users, to the extent the law allows.'],
      ['terms.s7.h', 'Changes', 'terms.s7.p', 'We may update these terms from time to time. Continued use means you accept the new terms.'],
    ],
  },
  privacy: {
    head: ['privacy.crumb', 'Privacy Policy', 'privacy.title', 'Privacy Policy', 'privacy.intro', 'This page explains what we collect, why, and the choices you have.'],
    sections: [
      ['privacy.s1.h', 'What we collect', 'privacy.s1.p', 'Your name, email or phone number when you sign in, the listings you post, and your messages to owners. With your consent we also record which pages and buttons are used so we can improve the site.'],
      ['privacy.s2.h', 'How we use it', 'privacy.s2.p', 'To run your account, show listings, connect buyers with owners, prevent misuse and improve the service.'],
      ['privacy.s3.h', 'Who sees your details', 'privacy.s3.p', 'Owner phone numbers are shown only to signed-in buyers, with daily limits. We do not sell your personal data.'],
      ['privacy.s4.h', 'Analytics and cookies', 'privacy.s4.p', 'We use our own privacy-friendly analytics only after you accept the banner. We never record what you type. You can decline and the site still works.'],
      ['privacy.s5.h', 'How long we keep data', 'privacy.s5.p', 'Analytics events are deleted after 13 months. Account and listing data is kept while your account is active.'],
      ['privacy.s6.h', 'Your choices', 'privacy.s6.p', 'You can ask us to see, correct or delete your data by writing to us from the Contact page.'],
    ],
  },
  rera: {
    head: ['rera.crumb', 'RERA Disclaimer', 'rera.title', 'RERA Disclaimer', 'rera.intro', 'Please read this before relying on any listing.'],
    sections: [
      ['rera.s1.h', 'Information only', 'rera.s1.p', 'Listings are posted by owners and are shown for information. PLOTSS does not confirm that a listing is registered under RERA or any other law unless it clearly says so.'],
      ['rera.s2.h', 'Do your own checks', 'rera.s2.p', 'Before buying, check the registration, title, land use, dues and approvals with the relevant authority and a qualified lawyer.'],
      ['rera.s3.h', 'AI screening', 'rera.s3.p', 'The AI-screened label means an automatic check found no obvious warning signs. It is not a legal verification.'],
    ],
  },
};

export function LegalPage({ doc }: { doc: 'terms' | 'privacy' | 'rera' }) {
  const d = LEGAL[doc];
  return (
    <Shell eyebrow={<T k={d.head[0]}>{d.head[1]}</T>} title={<T k={d.head[2]}>{d.head[3]}</T>} intro={<T k={d.head[4]}>{d.head[5]}</T>}>
      <div className="max-w-3xl space-y-8">
        {d.sections.map(([hk, h, pk, p]) => (
          <section key={hk}>
            <h2 className="font-serif-headline text-xl font-bold"><T k={hk}>{h}</T></h2>
            <p className="mt-2 text-graphite"><T k={pk}>{p}</T></p>
          </section>
        ))}
      </div>
    </Shell>
  );
}
