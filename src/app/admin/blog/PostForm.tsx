"use client";

import React, { useState, useRef } from "react";
import type { Post } from "@/lib/db/blog";
import { saveBlog, uploadBlogImage } from "../actions";
import {
  FileText, Search, Globe, AlertCircle, Eye, EyeOff,
  Upload, X, CheckCircle2, Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { RichEditor } from "./RichEditor";

/* ── shared style tokens ── */
const inp =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition";
const lab = "block text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-500 mb-1.5";
const section = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]";

type Tab = "content" | "seo" | "publishing";

export function PostForm({ post }: { post?: Post }) {
  const [tab, setTab] = useState<Tab>("content");
  const [titleVal, setTitleVal] = useState(post?.title ?? "");
  const [slugVal, setSlugVal] = useState(post?.slug ?? "");
  const [statusVal, setStatusVal] = useState<"draft" | "published">(post?.status ?? "draft");
  const [coverUrl, setCoverUrl] = useState(post?.cover ?? "");
  const [coverUploading, setCoverUploading] = useState(false);
  const [seoTitleLen, setSeoTitleLen] = useState((post?.seoTitle ?? "").length);
  const [seoDescLen, setSeoDescLen] = useState((post?.seoDescription ?? "").length);
  const [seoTitleVal, setSeoTitleVal] = useState(post?.seoTitle ?? "");
  const [seoDescVal, setSeoDescVal] = useState(post?.seoDescription ?? "");
  const coverFileRef = useRef<HTMLInputElement>(null);

  const autoSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTitleVal(v);
    if (!post) setSlugVal(autoSlug(v));
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await uploadBlogImage(fd);
      setCoverUrl(url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCoverUploading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "content", label: "Content", icon: <FileText className="h-4 w-4" /> },
    { id: "seo", label: "SEO", icon: <Search className="h-4 w-4" /> },
    { id: "publishing", label: "Publishing", icon: <Globe className="h-4 w-4" /> },
  ];

  /* Character-count helper */
  const CharCount = ({ count, max }: { count: number; max: number }) => (
    <span className={`text-[11px] ${count > max ? "text-red-500 font-semibold" : "text-slate-400"}`}>
      {count}/{max}
    </span>
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Page header */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/blog" className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 transition">
            ← Blog posts
          </Link>
          <h1 className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em] leading-7 text-slate-900">
            {post ? "Edit post" : "New post"}
          </h1>
          {post && (
            <div className="mt-0.5 font-mono text-xs text-slate-400">/blog/{post.slug}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {post?.status === "published" && (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" />
              View live
            </Link>
          )}
        </div>
      </div>

      <form action={saveBlog} className="space-y-4">
        <input type="hidden" name="id" value={post?.id ?? ""} />
        <input type="hidden" name="status" value={statusVal} />
        <input type="hidden" name="cover_image" value={coverUrl} />

        {/* ── Title + Slug card (always visible) ── */}
        <div className={section}>
          <div className="p-5 pb-4 border-b border-slate-100">
            <label className={lab}>Title *</label>
            <input
              name="title"
              required
              value={titleVal}
              onChange={handleTitleChange}
              placeholder="e.g. Industrial Plots in Ghaziabad: A Complete Buyer's Guide"
              className={inp + " text-base font-semibold"}
            />
          </div>
          <div className="px-5 py-4">
            <label className={lab}>URL slug</label>
            <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200 transition">
              <span className="shrink-0 border-r border-slate-100 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-400">
                /blog/
              </span>
              <input
                name="slug"
                value={slugVal}
                onChange={(e) => setSlugVal(e.target.value)}
                placeholder="auto-generated-from-title"
                className="flex-1 bg-white px-3 py-2.5 font-mono text-sm text-slate-700 focus:outline-none"
              />
            </div>
            {slugVal && (
              <div className="mt-1.5 font-mono text-[11px] text-slate-400">
                https://plotss.in/blog/{slugVal}
              </div>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-medium transition ${
                tab === t.id
                  ? "border-slate-900 bg-white text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── CONTENT TAB ── */}
        <div className={tab === "content" ? "space-y-4" : "hidden"}>

          {/* Excerpt */}
          <div className={section + " p-5"}>
            <label className={lab}>
              Excerpt{" "}
              <span className="font-normal normal-case tracking-normal text-slate-400">
                (shown in listings + default meta description)
              </span>
            </label>
            <textarea
              name="excerpt"
              rows={3}
              defaultValue={post?.excerpt}
              placeholder="A concise 1-2 sentence summary of the article..."
              className={inp}
            />
          </div>

          {/* Body editor */}
          <div className={section + " p-5"}>
            <label className={lab}>
              Body{" "}
              <span className="font-normal normal-case tracking-normal text-slate-400">
                (rich text — use toolbar for headings, links, images, lists)
              </span>
            </label>
            <RichEditor
              name="body"
              defaultValue={post?.body}
              placeholder="## Introduction&#10;&#10;Start writing the article here…"
            />
          </div>

          {/* Cover image */}
          <div className={section + " p-5"}>
            <label className={lab}>Cover image</label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              {/* Upload drop area */}
              <div
                onClick={() => coverFileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-100 sm:w-48 sm:shrink-0"
              >
                {coverUploading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                    <span className="text-xs text-slate-500">Uploading…</span>
                  </>
                ) : coverUrl ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Uploaded (WebP)</span>
                    <span className="text-[11px] text-slate-400">Click to replace</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">Upload image</span>
                    <span className="text-[11px] text-slate-400">Auto-converted to WebP</span>
                  </>
                )}
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ""; }}
                  aria-label="Upload cover image"
                />
              </div>

              {/* Preview + URL */}
              <div className="flex-1 space-y-3">
                {coverUrl && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverUrl}
                      alt="Cover preview"
                      className="h-36 w-full rounded-xl border border-slate-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverUrl("")}
                      className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
                      title="Remove cover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div>
                  <label className={lab}>Or paste image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className={inp}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className={section + " p-5"}>
            <label className={lab}>
              Tags{" "}
              <span className="font-normal normal-case tracking-normal text-slate-400">
                (comma separated, max 8)
              </span>
            </label>
            <input
              name="tags"
              defaultValue={post?.tags.join(", ")}
              placeholder="Industrial Land, Ghaziabad, Investment Guide"
              className={inp}
            />
          </div>

          {/* Key Takeaways */}
          <div className={section + " p-5"}>
            <label className={lab}>
              Key takeaways{" "}
              <span className="font-normal normal-case tracking-normal text-slate-400">
                (one per line — AEO/GEO answer engines)
              </span>
            </label>
            <textarea
              name="key_takeaways"
              rows={4}
              defaultValue={post?.keyTakeaways.join("\n")}
              placeholder={"Verify 7/12 extract before any payment\nNH-24 corridor offers best logistics access"}
              className={inp + " font-mono text-xs"}
            />
          </div>

          {/* FAQ */}
          <div className={section + " p-5"}>
            <label className={lab}>
              FAQ{" "}
              <span className="font-normal normal-case tracking-normal text-slate-400">
                (one per line: Question||Answer — FAQPage schema)
              </span>
            </label>
            <textarea
              name="faq"
              rows={5}
              defaultValue={post?.faq.map((f) => `${f.q}||${f.a}`).join("\n")}
              placeholder={"How long does mutation take in Ghaziabad?||Typically 4–8 weeks after registration.\nWhat documents are needed?||Sale deed, 7/12 extract, encumbrance certificate."}
              className={inp + " font-mono text-xs"}
            />
          </div>

          {/* Author */}
          <div className={section + " p-5"}>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-400">Author (E-E-A-T)</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={lab}>Byline name</label>
                <input name="author" defaultValue={post?.author} placeholder="PLOTSS Editorial" className={inp} />
              </div>
              <div>
                <label className={lab}>Role / credential</label>
                <input name="author_role" defaultValue={post?.authorRole ?? ""} placeholder="Land Advisory Lead, 8 years NCR" className={inp} />
              </div>
            </div>
            <div className="mt-4">
              <label className={lab}>Bio</label>
              <input name="author_bio" defaultValue={post?.authorBio ?? ""} placeholder="Short credential statement…" className={inp} />
            </div>
          </div>
        </div>

        {/* ── SEO TAB ── */}
        <div className={tab === "seo" ? "space-y-4" : "hidden"}>

          <div className={section + " p-5"}>
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <strong>Tip:</strong> Leave empty to automatically use the article title and excerpt. Add custom values only to improve or override the SERP snippet.
              </div>
            </div>

            {/* SEO title */}
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className={lab + " mb-0"}>SEO title</label>
                <CharCount count={seoTitleLen} max={60} />
              </div>
              <input
                name="seo_title"
                value={seoTitleVal}
                onChange={(e) => { setSeoTitleVal(e.target.value); setSeoTitleLen(e.target.value.length); }}
                placeholder={titleVal || "Leave empty to use article title"}
                className={inp}
                maxLength={80}
              />
              <div className="mt-1 text-[11px] text-slate-400">50–60 characters recommended</div>
            </div>

            {/* Meta description */}
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className={lab + " mb-0"}>Meta description</label>
                <CharCount count={seoDescLen} max={160} />
              </div>
              <textarea
                name="seo_description"
                rows={3}
                value={seoDescVal}
                onChange={(e) => { setSeoDescVal(e.target.value); setSeoDescLen(e.target.value.length); }}
                placeholder="Leave empty to use excerpt…"
                className={inp}
                maxLength={200}
              />
              <div className="mt-1 text-[11px] text-slate-400">120–160 characters recommended</div>
            </div>

            {/* SERP preview */}
            <div>
              <div className={lab}>SERP preview</div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-1 text-xs text-slate-400">
                  https://plotss.in/blog/{slugVal || "article-slug"}
                </div>
                <div className="text-[15px] font-medium leading-snug text-blue-700">
                  {seoTitleVal || titleVal || "Article title — PLOTSS"}
                </div>
                <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {seoDescVal || post?.excerpt || "Meta description will appear here…"}
                </div>
              </div>
            </div>
          </div>

          {/* Open Graph */}
          <div className={section + " p-5"}>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-400">Open Graph / Social sharing</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <strong className="font-semibold text-slate-700">OG title & description</strong> automatically inherit SEO values above.
              OG image uses the cover image you set in the Content tab. No separate input needed.
            </div>

            {/* OG image preview */}
            {coverUrl && (
              <div className="mt-4">
                <div className={lab}>OG image preview</div>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="OG image" className="h-40 w-full object-cover" />
                  <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="text-xs font-medium text-slate-700 truncate">
                      {seoTitleVal || titleVal || "Article title"}
                    </div>
                    <div className="text-[11px] text-slate-400">plotss.in</div>
                  </div>
                </div>
              </div>
            )}

            {!coverUrl && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                <ImageIcon className="h-4 w-4 shrink-0" />
                No cover image set — OG card will appear without an image. Add one in the Content tab.
              </div>
            )}
          </div>
        </div>

        {/* ── PUBLISHING TAB ── */}
        <div className={tab === "publishing" ? "space-y-4" : "hidden"}>
          <div className={section + " p-5"}>
            <label className={lab}>Status</label>
            <div className="flex gap-3">
              {(["draft", "published"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusVal(s)}
                  className={`flex-1 rounded-xl border px-4 py-4 text-left transition ${
                    statusVal === s
                      ? s === "published"
                        ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200"
                        : "border-amber-300 bg-amber-50 ring-2 ring-amber-200"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className={`text-sm font-semibold ${statusVal === s ? (s === "published" ? "text-emerald-700" : "text-amber-700") : "text-slate-600"}`}>
                    {s === "draft" ? "Draft" : "Published"}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {s === "draft" ? "Saved but not publicly visible" : "Live — visible to all visitors"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={section + " p-5"}>
            <label className={lab}>
              Published date{" "}
              <span className="font-normal normal-case tracking-normal text-slate-400">
                (auto-set on first publish if empty)
              </span>
            </label>
            <input
              name="published_at"
              type="datetime-local"
              defaultValue={post?.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : ""}
              className={inp}
            />
          </div>

          {post && (
            <div className={section + " px-5 py-4"}>
              <div className={lab}>Timestamps</div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Last updated</span>
                  <span className="font-medium text-slate-700">{post.updatedAt}</span>
                </div>
                {post.publishedAt && (
                  <div className="flex justify-between">
                    <span>Published</span>
                    <span className="font-medium text-slate-700">{post.publishedAt}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {statusVal === "published" && !titleVal && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Title is required before publishing.
            </div>
          )}
        </div>

        {/* ── Save footer ── */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <Link
            href="/admin/blog"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </Link>
          <div className="flex items-center gap-3">
            {statusVal === "published" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Will publish
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Save as draft
              </span>
            )}
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-[0.98] disabled:opacity-60"
            >
              {post ? "Save changes" : "Create post"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
