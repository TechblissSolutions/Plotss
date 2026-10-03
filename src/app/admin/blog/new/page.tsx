import { requireAdmin } from "@/lib/auth";
import { PostForm } from "../PostForm";

export default async function NewPost() {
  await requireAdmin();
  return <PostForm />;
}
