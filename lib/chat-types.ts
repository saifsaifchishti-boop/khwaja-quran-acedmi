export type Role = 'admin' | 'teacher' | 'student';
export type PersonT = { id: string; name: string; role: Role; code: string | null; has: boolean; v: string | null; seen: string | null };
export type ConvT = {
  id: string; kind: 'dm' | 'group'; title: string; members: PersonT[];
  last: { body: string; at: string; mine: boolean; t: string | null; del: boolean } | null; unread: number; sortAt: string;
};
