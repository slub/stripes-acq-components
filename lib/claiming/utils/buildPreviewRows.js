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
  CLAIM_PREVIEW_STATUS.manual,
  CLAIM_PREVIEW_STATUS.ready,
  CLAIM_PREVIEW_STATUS.sentMultiple,
];

export const getCriteriaKey = ({
  vendorId,
  acquisitionMethod,
  transmissionMethod,
}) => [vendorId, acquisitionMethod ?? '', transmissionMethod ?? ''].join('|');

const getStatus = (resolved, configs, { allowNotLate }) => {
  if (!resolved.isLate && !allowNotLate) return CLAIM_PREVIEW_STATUS.notLate;

  if (resolved.hasSequence && !resolved.isSequenceAvailable) return CLAIM_PREVIEW_STATUS.sequenceNotAvailable;

  if (resolved.isCompleted) return CLAIM_PREVIEW_STATUS.completed;

  const isManual = resolved.nextStage?.stage.deliveryType === CLAIM_SEQUENCE_DELIVERY_TYPE.manual;

  if (isManual) return CLAIM_PREVIEW_STATUS.manual;

  if (!configs.length) return CLAIM_PREVIEW_STATUS.noIntegration;

  return configs.length === 1 ? CLAIM_PREVIEW_STATUS.ready : CLAIM_PREVIEW_STATUS.sentMultiple;
};

/*
  `allowNoIntegration`: a piece without a claim sequence and without a matching integration stays
  selectable and is flagged `isStatusOnly`, the caller sets its status without sending a claim.
  A stage that requires an integration is rejected by mod-orders either way.
*/
export const buildPreviewRows = (resolvedClaims, configsByKey = {}, options = {}) => {
  const {
    allowNoIntegration = false,
    allowNotLate = false,
  } = options;

  return resolvedClaims.map((resolved) => {
    const configs = resolved.criteria ? (configsByKey[getCriteriaKey(resolved.criteria)] ?? []) : [];
    const status = getStatus(resolved, configs, { allowNotLate });
    const isStatusOnly = allowNoIntegration
      && !resolved.hasSequence
      && status === CLAIM_PREVIEW_STATUS.noIntegration;

    return {
      ...resolved,
      status,
      isSelectable: isStatusOnly || SELECTABLE_STATUSES.includes(status),
      isStatusOnly,
      configs,
    };
  });
};
