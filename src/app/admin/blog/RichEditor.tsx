"use client";

import React, { useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { uploadBlogImage } from "../actions";
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus,
  Link2, Link2Off, Image as ImageIcon,
  Undo, Redo, Code, AlignLeft,
} from "lucide-react";

interface Props {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}

export function RichEditor({ name, defaultValue = "", placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        code: {},
        codeBlock: {},
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate prose-sm max-w-none focus:outline-none min-h-[420px] px-5 py-4 text-slate-800 leading-7",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Link URL:", prev);
    if (url === null) return;
    if (!url) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
  }, [editor]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await uploadBlogImage(fd);
      editor.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, "") }).run();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
  }, [editor]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = "";
  };

  if (!editor) return null;

  const ToolBtn = ({
    onClick,
    active,
    disabled,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 ${
        active ? "bg-slate-200 text-slate-900" : ""
      }`}
    >
      {children}
    </button>
  );

  const Sep = () => <div className="mx-1 h-4 w-px bg-slate-200" aria-hidden />;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
        {/* History */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>
        <Sep />

        {/* Headings */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolBtn>
        <Sep />

        {/* Inline marks */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <Code className="h-3.5 w-3.5" />
        </ToolBtn>
        <Sep />

        {/* Lists / blocks */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="h-3.5 w-3.5" />
        </ToolBtn>
        <Sep />

        {/* Link */}
        <ToolBtn onClick={setLink} active={editor.isActive("link")} title="Insert / edit link">
          <Link2 className="h-3.5 w-3.5" />
        </ToolBtn>
        {editor.isActive("link") && (
          <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
            <Link2Off className="h-3.5 w-3.5" />
          </ToolBtn>
        )}
        <Sep />

        {/* Image */}
        <ToolBtn
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title={uploading ? "Uploading…" : "Insert image (uploads as WebP)"}
        >
          {uploading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          )}
        </ToolBtn>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Upload image"
        />

        {/* Paragraph reset */}
        <div className="ml-auto">
          <ToolBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolBtn>
        </div>
      </div>

      {/* Editor canvas */}
      <EditorContent editor={editor} />

      {/* Hidden textarea syncing editor HTML for form submission */}
      <HiddenInput editor={editor} name={name} />

      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .tiptap img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
        .tiptap a { color: #4f46e5; text-decoration: underline; }
        .tiptap pre { background: #f1f5f9; border-radius: 8px; padding: 1rem; font-size: 0.8rem; overflow-x: auto; }
        .tiptap blockquote { border-left: 3px solid #e2e8f0; margin-left: 0; padding-left: 1rem; color: #64748b; }
        .tiptap hr { border: none; border-top: 2px solid #f1f5f9; margin: 1.5rem 0; }
        .tiptap h1 { font-size: 1.5rem; font-weight: 700; }
        .tiptap h2 { font-size: 1.25rem; font-weight: 700; }
        .tiptap h3 { font-size: 1.1rem; font-weight: 600; }
      `}</style>
    </div>
  );
}

function HiddenInput({ editor, name }: { editor: ReturnType<typeof useEditor>; name: string }) {
  const [html, setHtml] = React.useState("");
  React.useEffect(() => {
    if (!editor) return;
    const update = () => setHtml(editor.getHTML());
    editor.on("update", update);
    update();
    return () => { editor.off("update", update); };
  }, [editor]);
  return <input type="hidden" name={name} value={html} />;
}
