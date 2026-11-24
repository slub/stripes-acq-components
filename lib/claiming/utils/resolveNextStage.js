/*
  Same rule as ClaimSequenceStageResolver in mod-orders (MODORDERS-1489).
  Returns null when a claim sequence with `STOP` has run through all stages.
*/
export const resolveNextStage = (piece, sequence) => {
  const stages = [...(sequence.stages || [])].sort((a, b) => a.stage - b.stage);
  const count = stages.length;
  const position = piece.claim?.sequence;
  const lastStage = position?.id === sequence.id ? position?.stage : undefined;
  const next = lastStage != null ? lastStage + 1 : 1;

  if (!count) return null;

  if (next <= count) return { number: next, count, stage: stages[next - 1] };

  if (sequence.afterLastStage === 'REPEAT_LAST') return { number: count, count, stage: stages[count - 1] };

  return null;
};
