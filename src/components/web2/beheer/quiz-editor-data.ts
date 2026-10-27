import { connectDB, Category } from '@/database';
import type { EditorCategory } from './quiz-editor-model';

export { toEditorQuiz } from './quiz-editor-model';

/** Categories for the editor's select, in the catalogue order. */
export async function loadEditorCategories(): Promise<EditorCategory[]> {
  await connectDB();
  const rows = await Category.find().select('title').sort({ sortOrder: 1, title: 1 }).lean();
  return rows.map((row) => ({ _id: String(row._id), title: String(row.title ?? '') }));
}
