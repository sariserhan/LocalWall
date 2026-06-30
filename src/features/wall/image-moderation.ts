export function buildModerationBatches(frontFiles: File[], backFiles: File[]) {
  const batches = frontFiles.slice(0, 2).map((file) => [file]);
  if (backFiles[0]) batches.push([backFiles[0]]);
  return batches;
}
