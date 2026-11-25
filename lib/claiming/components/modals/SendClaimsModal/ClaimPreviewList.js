import sortBy from 'lodash/sortBy';
import PropTypes from 'prop-types';
import { useMemo } from 'react';
import {
  FormattedMessage,
  useIntl,
} from 'react-intl';

import {
  Checkbox,
  MultiColumnList,
  NoValue,
} from '@folio/stripes/components';

import {
  renderClaimExpiryDate,
  renderNextStage,
  renderSentVia,
  renderStatus,
} from './ClaimPreviewCells';

const MESSAGE_PREFIX = 'stripes-acq-components.claiming.modal.sendClaim.preview';

const VISIBLE_COLUMNS = ['selected', 'title', 'vendor', 'nextStage', 'sentVia', 'claimExpiryDate', 'status'];

// Fixed widths switch off the MCL measuring, so long texts wrap instead of widening the modal.
// The sum stays below the width of a large modal.
const COLUMN_WIDTHS = {
  selected: '40px',
  title: '230px',
  vendor: '130px',
  nextStage: '150px',
  sentVia: '190px',
  claimExpiryDate: '140px',
  status: '160px',
};

/*
  PoC: pieces without a claim sequence have no stage, so their list leaves out "Next stage" and
  "Claim expiry date". "Vendor" and "Sent via" take over the widths, which keeps both lists aligned.
  To show the columns again (e.g. once such pieces count stages), drop `withStageColumns={false}`
  in SendClaimsPreviewModal.
  TODO: remove this note before the PR
*/
const VISIBLE_COLUMNS_WITHOUT_STAGE = ['selected', 'title', 'vendor', 'sentVia', 'status'];
const COLUMN_WIDTHS_WITHOUT_STAGE = {
  ...COLUMN_WIDTHS,
  vendor: '280px',
  sentVia: '330px',
};

const COLUMN_MAPPING = {
  selected: null,
  title: <FormattedMessage id={`${MESSAGE_PREFIX}.column.title`} />,
  vendor: <FormattedMessage id={`${MESSAGE_PREFIX}.column.vendor`} />,
  nextStage: <FormattedMessage id={`${MESSAGE_PREFIX}.column.nextStage`} />,
  sentVia: <FormattedMessage id={`${MESSAGE_PREFIX}.column.sentVia`} />,
  claimExpiryDate: <FormattedMessage id={`${MESSAGE_PREFIX}.column.claimExpiryDate`} />,
  status: <FormattedMessage id={`${MESSAGE_PREFIX}.column.status`} />,
};

// The full title stays available as a tooltip
const MAX_TITLE_LENGTH = 60;

const truncate = (value = '') => (
  value.length > MAX_TITLE_LENGTH ? `${value.slice(0, MAX_TITLE_LENGTH)}…` : value
);

export const ClaimPreviewList = ({
  id,
  onToggle,
  rows,
  selectedIds,
  withStageColumns = true,
}) => {
  const intl = useIntl();

  const contentData = useMemo(() => sortBy(rows, ['claim.vendorName', 'claim.title']), [rows]);

  const formatter = {
    selected: ({ claim, isSelectable }) => (
      <Checkbox
        aria-label={intl.formatMessage({ id: `${MESSAGE_PREFIX}.selectPiece` }, { title: claim.title })}
        checked={isSelectable && selectedIds.includes(claim.id)}
        disabled={!isSelectable}
        onChange={() => onToggle(claim.id)}
      />
    ),
    // MCL cells are flex rows, the wrapper keeps the lines stacked
    title: ({ claim }) => (
      <div>
        <div title={claim.title}>{truncate(claim.title)}</div>
        {claim.displaySummary && <div>{claim.displaySummary}</div>}
      </div>
    ),
    vendor: ({ claim }) => claim.vendorName || claim.vendorCode || <NoValue />,
    nextStage: renderNextStage,
    sentVia: renderSentVia,
    claimExpiryDate: renderClaimExpiryDate,
    status: renderStatus,
  };

  return (
    <MultiColumnList
      columnIdPrefix={id}
      columnMapping={COLUMN_MAPPING}
      columnWidths={withStageColumns ? COLUMN_WIDTHS : COLUMN_WIDTHS_WITHOUT_STAGE}
      contentData={contentData}
      formatter={formatter}
      id={id}
      interactive={false}
      visibleColumns={withStageColumns ? VISIBLE_COLUMNS : VISIBLE_COLUMNS_WITHOUT_STAGE}
    />
  );
};

ClaimPreviewList.propTypes = {
  id: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  withStageColumns: PropTypes.bool,
};
