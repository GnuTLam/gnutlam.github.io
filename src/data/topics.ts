export interface Topic {
  key:   string;
  title: string;
  tone:  string;
  desc:  string;
  tags:  string[];
}

export const TOPICS: Topic[] = [
  /* tones deliberately limited to two analogous phosphor tones — CRT
     amber + burnt orange — so category accents read as one calm system */
  { key: 'rust',    title: 'RUST & ASYNC',   tone: 'var(--acc)',  desc: 'Concurrency, actors, and the borrow checker met in anger.',   tags: ['rust','tokio','actors'] },
  { key: 'ai',      title: 'AI AGENTS',      tone: 'var(--acc2)', desc: 'Orchestrators, LLM tool-use, and vector retrieval.',            tags: ['agents','llms','ann','vectordb','fsm'] },
  { key: 'data',    title: 'DATA PIPELINES', tone: 'var(--acc)',  desc: 'Terabyte jobs, skew, and squeezing throughput.',                tags: ['spark','scala','performance','latency'] },
  { key: 'scale',   title: 'SCALE & INFRA',  tone: 'var(--acc2)', desc: 'Fan-out, kernel knobs, and surviving real load.',              tags: ['websockets','scale','linux'] },
  { key: 'storage', title: 'STORAGE',        tone: 'var(--acc)',  desc: 'Postgres, queues, and event-sourced state.',                   tags: ['postgres','queues','billing','architecture'] },
  { key: 'craft',   title: 'CRAFT',          tone: 'var(--acc2)', desc: 'Post-mortems, pragmatism, and engineering taste.',             tags: ['philosophy','craft','pragmatism','post-mortem'] },
];

export function topicOf(tags: string[]): Topic {
  return TOPICS.find(t => tags.some(tag => t.tags.includes(tag))) ?? TOPICS[TOPICS.length - 1];
}
