import { supabase } from './supabase';

interface RemoteProgress {
  chapter_id: string;
  stars: number;
  completed: boolean;
}

// Push a single chapter completion + stars to Supabase (upsert)
export async function syncChapterToRemote(chapterId: string, stars: number, completed: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('chapter_progress').upsert({
    user_id:    user.id,
    chapter_id: chapterId,
    stars,
    completed,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,chapter_id' });
}

// Pull all chapter progress from Supabase and merge into localStorage
// Remote wins if stars are higher or chapter is completed remotely but not locally
export async function loadRemoteProgressIntoLocal(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('chapter_progress')
    .select('chapter_id, stars, completed')
    .eq('user_id', user.id);

  if (error || !data) return;

  // Merge completions
  const localCompletedRaw = localStorage.getItem('rts-chapters-complete');
  const localCompleted: string[] = localCompletedRaw ? JSON.parse(localCompletedRaw) : [];
  const completedSet = new Set(localCompleted);

  // Merge stars
  const localStarsRaw = localStorage.getItem('rts-chapter-stars');
  const localStars: Record<string, number> = localStarsRaw ? JSON.parse(localStarsRaw) : {};

  let changed = false;
  for (const row of data as RemoteProgress[]) {
    if (row.completed && !completedSet.has(row.chapter_id)) {
      completedSet.add(row.chapter_id);
      changed = true;
    }
    if ((localStars[row.chapter_id] ?? 0) < row.stars) {
      localStars[row.chapter_id] = row.stars;
      changed = true;
    }
  }

  if (changed) {
    localStorage.setItem('rts-chapters-complete', JSON.stringify([...completedSet]));
    localStorage.setItem('rts-chapter-stars',     JSON.stringify(localStars));
  }
}
