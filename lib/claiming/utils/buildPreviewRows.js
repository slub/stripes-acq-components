import { CLAIM_SEQUENCE_DELIVERY_TYPE } from './resolveClaim';

export const CLAIM_PREVIEW_STATUS = {
  completed: 'completed',
  manual: 'manual',
  noIntegration: 'noIntegration',
  notLate: 'notLate',
  ready: 'ready',
  sentMultiple: 'sentMultiple',
  sequenceNotAvailable: 'sequenceNotAvailable',
};

const SELECTABLE_STATUSES = [
  CLAIM_PREVIEW_STATUS.ready,
  CLAIM_PREVIEW_STATUS.sentMultiple,
];

export const getCriteriaKey = ({
  vendorId,
  acquisitionMethod,
  transmissionMethod,
}) => [vendorId, acquisitionMethod ?? '', transmissionMethod ?? ''].join('|');

const getStatus = (resolved, configs) => {
  if (!resolved.isLate) return CLAIM_PREVIEW_STATUS.notLate;

  if (resolved.hasSequence && !resolved.isSequenceAvailable) return CLAIM_PREVIEW_STATUS.sequenceNotAvailable;

  if (resolved.isCompleted) return CLAIM_PREVIEW_STATUS.completed;

  const isManual = resolved.nextStage?.stage.deliveryType === CLAIM_SEQUENCE_DELIVERY_TYPE.manual;

  if (isManual) return CLAIM_PREVIEW_STATUS.manual;

  if (!configs.length) return CLAIM_PREVIEW_STATUS.noIntegration;

  return configs.length === 1 ? CLAIM_PREVIEW_STATUS.ready : CLAIM_PREVIEW_STATUS.sentMultiple;
};

export const buildPreviewRows = (resolvedClaims, configsByKey = {}) => {
  return resolvedClaims.map((resolved) => {
    const configs = resolved.criteria ? (configsByKey[getCriteriaKey(resolved.criteria)] ?? []) : [];
    const status = getStatus(resolved, configs);

    return {
      ...resolved,
      status,
      isSelectable: SELECTABLE_STATUSES.includes(status),
      configs,
    };
  });
};
