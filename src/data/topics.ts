interface Topic {
  key:   string;
  title: string;
  tone:  string;
  desc:  string;
  tags:  string[];
}

export const TOPICS: Topic[] = [
  /* each category owns one tone of the "Patina" family (a warm oxidized-metal
     set, chroma ~half of the accent). These are DEDICATED --cat-* vars, decoupled
     from the semantic colors (--accent/--yellow/--green), so category color
     stays quiet while danger/warning/identity keep their signal strength.
     Vars flip per [data-palette]; both blocks are AA-verified on the chip wash. */
  { key: 'rust',    title: 'RUST & ASYNC',   tone: 'var(--cat-rust)',    desc: 'Concurrency, actors, and the borrow checker met in anger.',   tags: ['rust','tokio','actors'] },
  { key: 'ai',      title: 'AI AGENTS',      tone: 'var(--cat-ai)',      desc: 'Orchestrators, LLM tool-use, and vector retrieval.',            tags: ['agents','llms','ann','vectordb','fsm'] },
  { key: 'data',    title: 'DATA PIPELINES', tone: 'var(--cat-data)',    desc: 'Terabyte jobs, skew, and squeezing throughput.',                tags: ['spark','scala','performance','latency'] },
  { key: 'scale',   title: 'SCALE & INFRA',  tone: 'var(--cat-scale)',   desc: 'Fan-out, kernel knobs, and surviving real load.',              tags: ['websockets','scale','linux'] },
  { key: 'storage', title: 'STORAGE',        tone: 'var(--cat-storage)', desc: 'Postgres, queues, and event-sourced state.',                   tags: ['postgres','queues','billing','architecture'] },
  { key: 'craft',   title: 'CRAFT',          tone: 'var(--cat-craft)',   desc: 'Post-mortems, pragmatism, and engineering taste.',             tags: ['philosophy','craft','pragmatism','post-mortem'] },
];

export function topicOf(tags: string[]): Topic {
  return TOPICS.find(t => tags.some(tag => t.tags.includes(tag))) ?? TOPICS[TOPICS.length - 1];
}

/* per-category post counts, counted the same way the filters cut (topicOf)
   so counts always match results — one post = one category */
export function countByTopic(posts: { tags: string[] }[]) {
  return TOPICS
    .map(t => ({ ...t, n: posts.filter(p => topicOf(p.tags).key === t.key).length }))
    .filter(t => t.n > 0);
}
