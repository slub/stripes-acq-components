import { useMemo } from 'react';
import { useQueries } from 'react-query';

import {
  useNamespace,
  useOkapiKy,
} from '@folio/stripes/core';

import {
  EFFECTIVE_EXPORT_CONFIGS_API,
  FOLIO_EXPORT_TYPE,
} from '../../../constants';
import { getCriteriaKey } from '../../utils';

// mod-orders caches this lookup for 30 seconds as well (MODORDERS-1491)
const STALE_TIME = 30_000;

/*
  One query per combination of vendor, acquisition method and transmission method,
  so reopening with a changed selection only fetches the combinations that are new.
*/
export const useClaimEffectiveConfigs = (criteriaList = [], options = {}) => {
  const {
    enabled = true,
    tenantId,
  } = options;

  const ky = useOkapiKy({ tenant: tenantId });
  const [namespace] = useNamespace({ key: 'claim-effective-configs' });

  const results = useQueries(criteriaList.map((criteria) => ({
    queryKey: [namespace, tenantId, criteria.vendorId, criteria.acquisitionMethod, criteria.transmissionMethod],
    queryFn: ({ signal }) => ky
      .get(EFFECTIVE_EXPORT_CONFIGS_API, {
        searchParams: { type: FOLIO_EXPORT_TYPE.CLAIMS, ...criteria },
        signal,
      })
      .json(),
    enabled,
    retry: false,
    staleTime: STALE_TIME,
  })));

  // useQueries returns a new array on every render, the timestamps change only with the data
  const updatedAt = results.map(({ dataUpdatedAt }) => dataUpdatedAt).join();

  const configsByKey = useMemo(() => {
    return criteriaList.reduce((acc, criteria, index) => {
      acc[getCriteriaKey(criteria)] = results[index]?.data?.configs ?? [];

      return acc;
    }, {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criteriaList, updatedAt]);

  return {
    configsByKey,
    isError: results.some(({ isError }) => isError),
    isFetching: results.some(({ isFetching }) => isFetching),
    isLoading: results.some(({ isLoading }) => isLoading),
  };
};
