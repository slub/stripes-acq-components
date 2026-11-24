import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import {
  Col,
  KeyValue,
  MessageBanner,
  Row,
} from '@folio/stripes/components';

import { CLAIM_PREVIEW_STATUS } from '../../../utils';
import {
  renderClaimExpiryDate,
  renderNextStage,
  renderSentVia,
  renderStatus,
} from './ClaimPreviewCells';

import css from './SendClaimsPreviewModal.css';

const MESSAGE_PREFIX = 'stripes-acq-components.claiming.modal.sendClaim.preview';
const NO_NAME = '-';

/*
  The preview of one piece, for callers that claim a single piece (piece form).
  Same values as a row of ClaimPreviewList, without table and checkbox.
  Stage and stage date only apply to a piece with a claim sequence.
*/
export const ClaimPreviewSingle = ({ row }) => {
  const { claim, hasSequence, isStatusOnly, status } = row;

  return (
    <>
      {isStatusOnly && (
        <MessageBanner type="warning">
          <FormattedMessage
            id={`${MESSAGE_PREFIX}.single.statusOnly`}
            values={{
              vendor: claim.vendorName || claim.vendorCode || NO_NAME,
              acquisitionMethod: claim.acquisitionMethodName || NO_NAME,
            }}
          />
        </MessageBanner>
      )}

      {status === CLAIM_PREVIEW_STATUS.sentMultiple && (
        <MessageBanner type="warning">
          <FormattedMessage id={`${MESSAGE_PREFIX}.single.sentMultiple`} />
        </MessageBanner>
      )}

      <Row className={css.sectionFields}>
        {hasSequence && (
          <Col
            xs={6}
            md={3}
          >
            <KeyValue
              label={<FormattedMessage id={`${MESSAGE_PREFIX}.column.nextStage`} />}
              value={renderNextStage(row)}
            />
          </Col>
        )}
        <Col
          xs={6}
          md={hasSequence ? 3 : 6}
        >
          <KeyValue
            label={<FormattedMessage id={`${MESSAGE_PREFIX}.column.sentVia`} />}
            value={renderSentVia(row)}
          />
        </Col>
        {hasSequence && (
          <Col
            xs={6}
            md={3}
          >
            <KeyValue
              label={<FormattedMessage id={`${MESSAGE_PREFIX}.column.claimExpiryDate`} />}
              value={renderClaimExpiryDate(row)}
            />
          </Col>
        )}
        <Col
          xs={6}
          md={hasSequence ? 3 : 6}
        >
          <KeyValue
            label={<FormattedMessage id={`${MESSAGE_PREFIX}.column.status`} />}
            value={renderStatus(row)}
          />
        </Col>
      </Row>
    </>
  );
};

ClaimPreviewSingle.propTypes = {
  row: PropTypes.object.isRequired,
};
