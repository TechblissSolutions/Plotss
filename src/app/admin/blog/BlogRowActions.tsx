"use client";

import React from "react";
import Link from "next/link";
import { Edit3, Eye, Globe, EyeOff, Copy, Trash2 } from "lucide-react";
import { publishBlog, unpublishBlog, duplicateBlog, deleteBlog } from "../actions";

interface Props {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
}

export function BlogRowActions({ id, slug, title, status }: Props) {
  return (
    <div className="flex items-center justify-end gap-1">
      {/* Edit */}
      <Link
        href={`/admin/blog/${id}`}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        title="Edit"
      >
        <Edit3 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Edit</span>
      </Link>

      {/* View live */}
      {status === "published" && (
        <Link
          href={`/blog/${slug}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          title="View live"
        >
          <Eye className="h-3.5 w-3.5" />
        </Link>
      )}

      {/* Publish / Unpublish */}
      {status === "draft" ? (
        <form action={publishBlog} className="inline">
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            title="Publish"
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Publish</span>
          </button>
        </form>
      ) : (
        <form action={unpublishBlog} className="inline">
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            title="Unpublish"
            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Unpublish</span>
          </button>
        </form>
      )}

      {/* Duplicate */}
      <form action={duplicateBlog} className="inline">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          title="Duplicate as draft"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </form>

      {/* Delete — confirm in client */}
      <form
        action={deleteBlog}
        onSubmit={(e) => {
          if (!confirm(`Delete "${title}"? This cannot be undone.`)) e.preventDefault();
        }}
        className="inline"
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          title="Delete"
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
