// Tiny id generator — readable ids like "c_l4x2p9" without extra dependencies.
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
