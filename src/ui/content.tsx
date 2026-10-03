'use client';
import React, { createContext, useContext } from 'react';

/** Editable copy: `texts[key]` overrides the default written in the JSX; `hidden[key]` hides a <Show> section. */
export type ContentState = { texts: Record<string, string>; hidden: Record<string, boolean> };
const Ctx = createContext<ContentState>({ texts: {}, hidden: {} });

export const ContentProvider = ({ value, children }: { value: ContentState; children: React.ReactNode }) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);
export const useContent = () => useContext(Ctx);

/** `<T k="home.hero.title">Default text</T>` — renders the admin override when one exists. */
export function T({ k, children }: { k: string; children: string }) {
  const { texts } = useContent();
  const v = texts[k];
  return <>{v !== undefined && v !== '' ? v : children}</>;
}

/** `<Show k="home.testimonials">…</Show>` — a section the admin can switch off. */
export function Show({ k, children }: { k: string; children: React.ReactNode }) {
  const { hidden } = useContent();
  return hidden[k] ? null : <>{children}</>;
}
