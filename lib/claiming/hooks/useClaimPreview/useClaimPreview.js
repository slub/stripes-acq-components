import { useMemo } from 'react';

import { useStripes } from '@folio/stripes/core';

import {
  buildPreviewRows,
  getCriteriaKey,
  resolveClaim,
} from '../../utils';
import { useClaimEffectiveConfigs } from '../useClaimEffectiveConfigs';
import { useClaimSequencesById } from '../useClaimSequencesById';

const DEFAULT_CLAIMS = [];

/*
  Tells for each piece how it would be claimed: next stage of its claim sequence,
  matching integrations and whether it can be sent at all.
  `isError` also covers a missing permission, so pieces are never shown as
  "no matching integration" just because the lookup did not run.
*/
export const useClaimPreview = (claims = DEFAULT_CLAIMS, options = {}) => {
  const {
    enabled = true,
    tenantId,
  } = options;

  const stripes = useStripes();
  const needsSequences = useMemo(() => claims.some(({ claimSequenceId }) => Boolean(claimSequenceId)), [claims]);
  const hasPerms = Boolean(stripes.hasPerm('data-export.effective-configs.collection.get'))
    && (!needsSequences || Boolean(stripes.hasPerm('orders-storage.claim-sequences.collection.get')));
  const canLoad = enabled && hasPerms;

  const {
    sequencesById,
    isError: isSequencesError,
    isLoading: isSequencesLoading,
  } = useClaimSequencesById({ enabled: canLoad && needsSequences, tenantId });

  // Pieces must not be resolved against a missing sequence list
  const sequencesReady = !needsSequences || (!isSequencesLoading && !isSequencesError);

  const resolvedClaims = useMemo(
    () => claims.map((claim) => resolveClaim(claim, sequencesById)),
    [claims, sequencesById],
  );

  const criteriaList = useMemo(() => {
    const byKey = new Map();

    resolvedClaims.forEach(({ criteria }) => {
      if (criteria) byKey.set(getCriteriaKey(criteria), criteria);
    });

    return Array.from(byKey.values());
  }, [resolvedClaims]);

  const {
    configsByKey,
    isError: isConfigsError,
    isLoading: isConfigsLoading,
  } = useClaimEffectiveConfigs(criteriaList, { enabled: canLoad && sequencesReady, tenantId });

  const rows = useMemo(
    () => buildPreviewRows(resolvedClaims, configsByKey),
    [resolvedClaims, configsByKey],
  );

  const isError = !hasPerms || isSequencesError || isConfigsError;

  return {
    rows,
    isError,
    isLoading: !isError && (!sequencesReady || isConfigsLoading),
  };
};
