// Stack-based signal: last-registered handler wins.
const stack: Array<() => void> = [];

export function pushAdminHandler(fn: () => void): () => void {
  stack.push(fn);
  return () => {
    const idx = stack.lastIndexOf(fn);
    if (idx !== -1) stack.splice(idx, 1);
  };
}

export function openAdminPanel(): void {
  stack[stack.length - 1]?.();
}
