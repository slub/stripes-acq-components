import keyBy from 'lodash/keyBy';
import { useMemo } from 'react';
import { useQuery } from 'react-query';

import {
  useNamespace,
  useOkapiKy,
} from '@folio/stripes/core';

import {
  ALL_RECORDS_CQL,
  CLAIM_SEQUENCES_API,
  LIMIT_MAX,
} from '../../../constants';

// Same as for the effective configs, so reopening the modal soon after reuses the list
const STALE_TIME = 30_000;

export const useClaimSequencesById = (options = {}) => {
  const {
    enabled = true,
    tenantId,
  } = options;

  const ky = useOkapiKy({ tenant: tenantId });
  const [namespace] = useNamespace({ key: 'claim-sequences' });

  const {
    data,
    isError,
    isFetching,
    isLoading,
  } = useQuery({
    queryKey: [namespace, tenantId],
    queryFn: ({ signal }) => ky
      .get(CLAIM_SEQUENCES_API, { searchParams: { query: ALL_RECORDS_CQL, limit: LIMIT_MAX }, signal })
      .json(),
    enabled,
    retry: false,
    staleTime: STALE_TIME,
  });

  const sequencesById = useMemo(() => keyBy(data?.claimSequences ?? [], 'id'), [data]);

  return {
    sequencesById,
    isError,
    isFetching,
    isLoading,
  };
};
