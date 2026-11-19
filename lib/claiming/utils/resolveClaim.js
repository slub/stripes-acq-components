import { PIECE_STATUS } from '../../constants';
import { resolveNextStage } from './resolveNextStage';

export const CLAIM_SEQUENCE_DELIVERY_TYPE = {
  integration: 'INTEGRATION',
  manual: 'MANUAL',
};

const buildCriteria = (claim, transmissionMethod) => {
  if (!claim.vendorId) return undefined;

  return {
    vendorId: claim.vendorId,
    ...(claim.acquisitionMethod ? { acquisitionMethod: claim.acquisitionMethod } : {}),
    ...(transmissionMethod ? { transmissionMethod } : {}),
  };
};

/*
  Works out how a piece would be claimed, before the integrations are looked up.
  `criteria` is missing when no integration lookup is needed.
*/
export const resolveClaim = (claim, sequencesById = {}) => {
  const isLate = claim.receivingStatus === PIECE_STATUS.late;

  if (!claim.claimSequenceId) {
    return {
      claim,
      hasSequence: false,
      isLate,
      criteria: isLate ? buildCriteria(claim) : undefined,
    };
  }

  const sequence = sequencesById[claim.claimSequenceId];
  const base = { claim, hasSequence: true, isLate };

  // Deleted or inactive: the PO line has to be fixed first
  if (!sequence || sequence.isActive === false) {
    return { ...base, isSequenceAvailable: false };
  }

  const resolved = {
    ...base,
    isSequenceAvailable: true,
    stageCount: sequence.stages?.length ?? 0,
  };

  if (!isLate) return resolved;

  const nextStage = resolveNextStage(claim, sequence);

  if (!nextStage) return { ...resolved, isCompleted: true };

  const isManual = nextStage.stage.deliveryType === CLAIM_SEQUENCE_DELIVERY_TYPE.manual;

  return {
    ...resolved,
    nextStage,
    criteria: isManual ? undefined : buildCriteria(claim, nextStage.stage.transmissionMethod),
  };
};
