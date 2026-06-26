// Stack-based signal so the latest mounted contact surface wins.
const stack: Array<(page: string) => void> = [];

export function pushContactHandler(fn: (page: string) => void): () => void {
  stack.push(fn);
  return () => {
    const idx = stack.lastIndexOf(fn);
    if (idx !== -1) stack.splice(idx, 1);
  };
}

export function openContact(page: string): void {
  stack[stack.length - 1]?.(page);
}
