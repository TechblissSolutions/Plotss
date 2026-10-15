"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Upload, Download, AlertCircle, CheckCircle2, X, FileJson, ArrowRight } from "lucide-react";
import { importBlogPosts, type ImportResult } from "../../actions";

/* ── JSON example that matches the blog_posts schema ── */
const JSON_EXAMPLE = [
  {
    slug: "industrial-plots-ghaziabad-guide",
    title: "Industrial Plots in Ghaziabad: A Complete Buyer's Guide",
    excerpt:
      "Looking for industrial plots in Ghaziabad? This guide covers locations, legal checklist, and investment tips for 2026.",
    body: "## Introduction\n\nGhaziabad has become one of the fastest-growing industrial destinations in Delhi NCR.\n\n## Why Ghaziabad?\n\nStrategic location near Delhi, Noida, Greater Noida, and Meerut makes it a top industrial corridor.\n\n## What to Check Before Buying\n\n- Verify 7/12 extract\n- Check encumbrance certificate\n- Confirm zoning classification",
    cover_image: "https://example.com/cover-image.jpg",
    tags: ["Industrial Land", "Ghaziabad", "Investment Guide"],
    author: "PLOTSS Editorial",
    author_role: "Land Advisory Lead, 8 years in NCR land records",
    author_bio: "Covers industrial and commercial land transactions across Delhi NCR.",
    key_takeaways: [
      "Verify 7/12 extract before any payment",
      "NH-24 corridor offers best logistics access",
      "Mutation (dakhil-kharij) takes 4–8 weeks in Ghaziabad"
    ],
    faq: [
      {
        q: "What documents are needed to buy industrial land in Ghaziabad?",
        a: "Sale deed, 7/12 extract, encumbrance certificate, NOC from authority, and boundary survey are essential."
      },
      {
        q: "What is the minimum plot size for industrial use?",
        a: "Typically 500 sq.m for light industrial zones, 1000 sq.m for heavy industrial."
      }
    ],
    seo_title: "Industrial Plots in Ghaziabad | Buyer's Guide 2026",
    seo_description:
      "Complete guide to buying industrial plots in Ghaziabad. Locations, legal checklist, prices and investment tips."
  }
];

type ParsedPost = (typeof JSON_EXAMPLE)[0];

type ValidationError = { index: number; field: string; message: string };

function validate(posts: unknown[]): { valid: ParsedPost[]; errors: ValidationError[] } {
  const valid: ParsedPost[] = [];
  const errors: ValidationError[] = [];
  const seenSlugs = new Set<string>();

  posts.forEach((p, i) => {
    if (!p || typeof p !== "object") {
      errors.push({ index: i, field: "root", message: "Not an object" });
      return;
    }
    const post = p as Record<string, unknown>;
    let ok = true;

    if (!post.title || typeof post.title !== "string" || !post.title.trim()) {
      errors.push({ index: i, field: "title", message: "Required string" });
      ok = false;
    }
    if (!post.body || typeof post.body !== "string" || !post.body.trim()) {
      errors.push({ index: i, field: "body", message: "Required string (Markdown content)" });
      ok = false;
    }
    if (post.slug && typeof post.slug === "string") {
      const slug = post.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (seenSlugs.has(slug)) {
        errors.push({ index: i, field: "slug", message: `Duplicate slug "${slug}" in this file` });
        ok = false;
      } else {
        seenSlugs.add(slug);
      }
    }
    if (post.faq && !Array.isArray(post.faq)) {
      errors.push({ index: i, field: "faq", message: "Must be an array of {q, a} objects" });
      ok = false;
    }
    if (post.tags && !Array.isArray(post.tags)) {
      errors.push({ index: i, field: "tags", message: "Must be an array of strings" });
      ok = false;
    }

    if (ok) valid.push(post as ParsedPost);
  });

  return { valid, errors };
}

export function ImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawPosts, setRawPosts] = useState<unknown[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ReturnType<typeof validate> | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const arr = Array.isArray(json) ? json : [json];
        setRawPosts(arr);
        setParseError(null);
        const v = validate(arr);
        setValidation(v);
        setSelected(new Set(v.valid.map((_, i) => i)));
      } catch {
        setParseError("Invalid JSON — could not parse the file.");
        setRawPosts(null);
        setValidation(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!validation || selected.size === 0) return;
    const toImport = validation.valid.filter((_, i) => selected.has(i));
    setImporting(true);
    try {
      const res = await importBlogPosts(toImport);
      setResult(res);
    } finally {
      setImporting(false);
    }
  };

  const downloadExample = () => {
    const blob = new Blob([JSON.stringify(JSON_EXAMPLE, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plotss-blog-import-example.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/blog" className="text-xs font-medium text-slate-500 hover:text-slate-900">
            ← Blog posts
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Import JSON</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Upload a JSON file to bulk-import blog posts. All posts import as <strong>Draft</strong> — publish manually.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadExample}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Download JSON example
        </button>
      </div>

      {/* JSON schema reference */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Required JSON schema</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-1.5 pr-4 font-semibold">Field</th>
                <th className="pb-1.5 pr-4 font-semibold">Type</th>
                <th className="pb-1.5 font-semibold">Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[
                ["title", "string", "✅"],
                ["body", "string (Markdown)", "✅"],
                ["slug", "string (auto from title if omitted)", "—"],
                ["excerpt", "string", "—"],
                ["cover_image", "string (URL)", "—"],
                ["tags", "string[]", "—"],
                ["author", "string", "—"],
                ["author_role", "string", "—"],
                ["author_bio", "string", "—"],
                ["key_takeaways", "string[]", "—"],
                ["faq", "{ q: string; a: string }[]", "—"],
                ["seo_title", "string", "—"],
                ["seo_description", "string", "—"],
              ].map(([f, t, r]) => (
                <tr key={f} className="text-slate-700">
                  <td className="py-1.5 pr-4 font-mono font-medium">{f}</td>
                  <td className="py-1.5 pr-4 text-slate-500">{t}</td>
                  <td className="py-1.5">{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          The file can contain a single post object or an array of post objects. All posts are imported as <strong>Draft</strong> regardless of any status field in the JSON. Cover images must be publicly accessible URLs — no local paths.
        </p>
      </div>

      {/* Upload area */}
      {!rawPosts && !parseError && (
        <div
          className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center hover:border-slate-400 hover:bg-slate-50 transition"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dt = e.dataTransfer;
            if (dt.files[0]) {
              const synth = { target: { files: dt.files, value: "" } } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleFile(synth);
            }
          }}
        >
          <FileJson className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-600">Drop a JSON file or click to browse</p>
          <p className="mt-1 text-xs text-slate-400">Accepts .json files only</p>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <div className="font-semibold text-red-700">Parse error</div>
            <div className="mt-1 text-sm text-red-600">{parseError}</div>
          </div>
          <button type="button" onClick={() => { setParseError(null); setFileName(null); }} className="ml-auto shrink-0">
            <X className="h-4 w-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Validation results */}
      {validation && rawPosts && !result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <FileJson className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-700">{fileName}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{rawPosts.length} posts found</span>
            </div>
            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
              {validation.valid.length} valid
            </span>
            {validation.errors.length > 0 && (
              <span className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200">
                {validation.errors.length} error{validation.errors.length > 1 ? "s" : ""}
              </span>
            )}
            <button
              type="button"
              onClick={() => { setRawPosts(null); setValidation(null); setFileName(null); setParseError(null); }}
              className="ml-auto text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          </div>

          {/* Validation errors */}
          {validation.errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-600">Validation errors — these posts will be skipped</div>
              <ul className="space-y-1">
                {validation.errors.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Post {e.index + 1} · <code className="font-mono">{e.field}</code>: {e.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Valid posts preview */}
          {validation.valid.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Valid posts — select to import
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelected(new Set(validation.valid.map((_, i) => i)))}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >Select all</button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >Deselect all</button>
                </div>
              </div>
              <ul className="divide-y divide-slate-100">
                {validation.valid.map((p, i) => (
                  <li
                    key={i}
                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition ${
                      selected.has(i) ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                    onClick={() => toggleSelect(i)}
                  >
                    <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                      selected.has(i) ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white"
                    }`}>
                      {selected.has(i) && <span className="text-[10px] font-bold text-white">✓</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 leading-snug">{String(p.title)}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono">/blog/{String(p.slug || "auto-from-title")}</span>
                        {Array.isArray(p.tags) && p.tags[0] && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{String(p.tags[0])}</span>
                        )}
                        {p.excerpt && <span className="line-clamp-1 max-w-xs">{String(p.excerpt)}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Import CTA */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <div className="font-semibold text-slate-900">{selected.size} post{selected.size > 1 ? "s" : ""} selected</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  All will be imported as <strong>Draft</strong>. Publish manually after review.
                </div>
              </div>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {importing ? (
                  <>Importing…</>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import {selected.size} post{selected.size > 1 ? "s" : ""}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Import result */}
      {result && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-900">Import complete</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
              <div className="text-2xl font-bold tabular-nums text-emerald-700">{result.imported}</div>
              <div className="text-xs font-medium text-emerald-600">Imported</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
              <div className="text-2xl font-bold tabular-nums text-amber-700">{result.skipped}</div>
              <div className="text-xs font-medium text-amber-600">Skipped</div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
              <div className="text-2xl font-bold tabular-nums text-red-700">{result.errors.length}</div>
              <div className="text-xs font-medium text-red-600">Errors</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="mb-1.5 text-xs font-semibold text-red-700">Error log:</div>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-600">{e}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            <Link
              href="/admin/blog"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View all posts
            </Link>
            <button
              type="button"
              onClick={() => { setResult(null); setRawPosts(null); setValidation(null); setFileName(null); }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Import more
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
