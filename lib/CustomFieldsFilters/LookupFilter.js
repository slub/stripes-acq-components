import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { TextField } from '@folio/stripes/components';
import { Pluggable } from '@folio/stripes/core';
import {
  getLookupAdapter,
  unwrapSelectedRecord,
  useLookupRecord,
} from '@folio/stripes/smart-components';

// Shaped like PluggableOrganizationFilter. Serves every lookup source, since the
// plugin to open comes from the adapter registry.
const LookupFilter = ({
  ariaLabel,
  disabled = false,
  name,
  onChange,
  refEntityType,
  selectedValues,
}) => {
  const intl = useIntl();
  const adapter = getLookupAdapter(refEntityType);
  const referenceId = selectedValues?.[0];

  const { label } = useLookupRecord({ refEntityType, id: referenceId });

  const onSelect = useCallback((selection) => {
    const record = unwrapSelectedRecord(selection);

    if (record?.id) onChange({ name, values: [record.id] });
  }, [name, onChange]);

  if (!adapter) return null;

  return (
    <>
      <TextField
        aria-label={ariaLabel}
        marginBottom0
        type="text"
        value={(referenceId && label) || ''}
        disabled
      />

      <Pluggable
        aria-haspopup="true"
        dataKey={refEntityType}
        disabled={disabled}
        id={`${name}-plugin`}
        marginBottom0
        searchButtonStyle="link"
        searchLabel={intl.formatMessage({ id: adapter.searchLabelId })}
        type={adapter.pluginType}
        {...{ [adapter.selectProp]: onSelect }}
      >
        <span>
          <FormattedMessage id="stripes-smart-components.customFields.lookup.noPlugin" />
        </span>
      </Pluggable>
    </>
  );
};

LookupFilter.propTypes = {
  ariaLabel: PropTypes.string,
  disabled: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  refEntityType: PropTypes.string,
  selectedValues: PropTypes.arrayOf(PropTypes.string),
};

export default LookupFilter;
