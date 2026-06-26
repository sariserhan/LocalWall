// Stack-based signal so the latest mounted bug-report surface wins.
const stack: Array<(page: string) => void> = [];

export function pushBugReportHandler(fn: (page: string) => void): () => void {
  stack.push(fn);
  return () => {
    const idx = stack.lastIndexOf(fn);
    if (idx !== -1) stack.splice(idx, 1);
  };
}

export function openBugReport(page: string): void {
  stack[stack.length - 1]?.(page);
}
