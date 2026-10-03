import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAllPostsAdmin } from "@/lib/db/blog";
import { PostForm } from "../PostForm";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const post = (await getAllPostsAdmin()).find((p) => p.id === id);
  if (!post) notFound();
  return <PostForm post={post} />;
}
