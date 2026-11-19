import identity from 'lodash/identity';
import PropTypes from 'prop-types';
import {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Field,
  useForm,
  useFormState,
} from 'react-final-form';
import {
  FormattedMessage,
  useIntl,
} from 'react-intl';

import {
  Button,
  Col,
  Headline,
  Loading,
  MessageBanner,
  Modal,
  Row,
  TextArea,
} from '@folio/stripes/components';

import { ModalFooter } from '../../../../ModalFooter';
import { validateRequired } from '../../../../utils';
import { useClaimPreview } from '../../../hooks';
import {
  CLAIM_PREVIEW_STATUS,
  getClaimingIntervalFromDate,
} from '../../../utils';
import { FieldClaimingDate } from '../../FieldClaimingDate';
import { validateClaimingDate } from '../../FieldClaimingDate/utils';
import { ClaimPreviewList } from './ClaimPreviewList';

import css from './SendClaimsPreviewModal.css';

const MESSAGE_PREFIX = 'stripes-acq-components.claiming.modal.sendClaim';
const PREVIEW_PREFIX = `${MESSAGE_PREFIX}.preview`;

const SELECTED_IDS_FIELD = 'claimingPieceIds';
const INTERVAL_FIELD = 'claimingInterval';
const DEFAULT_SELECTED_IDS = [];

/*
  "Send claim" with a preview: tells for each piece at which stage and through which
  integration it is claimed, and only sends the pieces that are checked.
  Rendered only while open, so every opening starts with a fresh selection.
*/
export const SendClaimsPreviewModal = ({
  claims,
  disabled = false,
  handleSubmit,
  onCancel,
  tenantId,
}) => {
  const intl = useIntl();
  const form = useForm();
  const { values } = useFormState({ subscription: { values: true } });

  const { rows, isLoading, isError } = useClaimPreview(claims, { tenantId });

  const modalLabel = intl.formatMessage({ id: `${MESSAGE_PREFIX}.heading` }, { count: undefined });
  const isSelectionInitialized = values[SELECTED_IDS_FIELD] !== undefined;
  const selectedIds = values[SELECTED_IDS_FIELD] ?? DEFAULT_SELECTED_IDS;

  // The form outlives the modal: no values of a previous opening, no dirty form left behind
  useEffect(() => {
    form.reset();

    return () => form.reset();
  }, [form]);

  // Set once the rows are loaded, so the defaults reflect the real matches
  useEffect(() => {
    if (!isLoading && !isError && !isSelectionInitialized) {
      form.change(
        SELECTED_IDS_FIELD,
        rows.filter(({ isSelectable }) => isSelectable).map(({ claim }) => claim.id),
      );
    }
  }, [form, isError, isLoading, isSelectionInitialized, rows]);

  const withSequence = useMemo(() => rows.filter(({ hasSequence }) => hasSequence), [rows]);
  const withoutSequence = useMemo(() => rows.filter(({ hasSequence }) => !hasSequence), [rows]);

  const filterSelected = useCallback((list, ids = selectedIds) => {
    return list.filter(({ claim, isSelectable }) => isSelectable && ids.includes(claim.id));
  }, [selectedIds]);

  const selectedRows = filterSelected(rows);
  const selectedCount = selectedRows.length;
  const isDateRequired = filterSelected(withoutSequence).length > 0;
  const sentMultipleCount = rows.filter(({ status }) => status === CLAIM_PREVIEW_STATUS.sentMultiple).length;
  const blockedCount = rows.filter(({ isSelectable }) => !isSelectable).length;

  const onToggle = useCallback((pieceId) => {
    form.change(
      SELECTED_IDS_FIELD,
      selectedIds.includes(pieceId)
        ? selectedIds.filter((id) => id !== pieceId)
        : [...selectedIds, pieceId],
    );
  }, [form, selectedIds]);

  // Reads the selection from the form, so unchecking a piece revalidates the date at once
  const validateDate = useCallback((value, allValues) => {
    const ids = allValues[SELECTED_IDS_FIELD] ?? DEFAULT_SELECTED_IDS;
    const isRequired = filterSelected(withoutSequence, ids).length > 0;

    if (!value) return isRequired ? validateRequired(value) : undefined;

    return validateClaimingDate(value);
  }, [filterSelected, withoutSequence]);

  const onSend = useCallback((e) => {
    // TODO: send 0 or drop the interval once mod-orders takes it from the stage (MODORDERS-1489).
    // Until then the interval of the next stage is right for pieces sharing that stage.
    const stageInterval = selectedRows[0]?.nextStage?.stage.interval;
    const claimingInterval = isDateRequired && values.claimingDate
      ? getClaimingIntervalFromDate(values.claimingDate)
      : stageInterval;

    form.batch(() => {
      form.change(SELECTED_IDS_FIELD, selectedRows.map(({ claim }) => claim.id));
      form.change(INTERVAL_FIELD, claimingInterval);
    });

    return handleSubmit(e);
  }, [form, handleSubmit, isDateRequired, selectedRows, values.claimingDate]);

  const footer = (
    <ModalFooter
      renderStart={(
        <Button
          marginBottom0
          onClick={onCancel}
        >
          <FormattedMessage id="stripes-acq-components.FormFooter.cancel" />
        </Button>
      )}
      renderEnd={(
        <Button
          buttonStyle="primary"
          disabled={disabled || isLoading || isError || !selectedCount}
          marginBottom0
          onClick={onSend}
        >
          <FormattedMessage
            id={`${PREVIEW_PREFIX}.send`}
            values={{ count: selectedCount }}
          />
        </Button>
      )}
    />
  );

  const renderSection = (id, headingId, list) => (
    <div className={css.section}>
      <Headline
        margin="none"
        size="large"
        tag="h3"
      >
        <FormattedMessage
          id={headingId}
          values={{ selected: filterSelected(list).length, total: list.length }}
        />
      </Headline>
      <ClaimPreviewList
        id={id}
        onToggle={onToggle}
        rows={list}
        selectedIds={selectedIds}
      />
    </div>
  );

  const renderContent = () => {
    // Without the lookup every piece would read "no matching claiming integration"
    if (isError) {
      return (
        <MessageBanner type="error">
          <FormattedMessage id={`${PREVIEW_PREFIX}.loadError`} />
        </MessageBanner>
      );
    }

    if (isLoading || !isSelectionInitialized) return <Loading />;

    return (
      <form onSubmit={onSend}>
        {(sentMultipleCount > 0 || blockedCount > 0) && (
          <MessageBanner type="warning">
            {sentMultipleCount > 0 && (
              <FormattedMessage
                id={`${PREVIEW_PREFIX}.banner.sentMultiple`}
                values={{ count: sentMultipleCount }}
              />
            )}
            {sentMultipleCount > 0 && blockedCount > 0 && ' '}
            {blockedCount > 0 && (
              <FormattedMessage
                id={`${PREVIEW_PREFIX}.banner.blocked`}
                values={{ count: blockedCount }}
              />
            )}
          </MessageBanner>
        )}

        {withSequence.length > 0 && renderSection(
          'send-claim-with-sequence',
          `${PREVIEW_PREFIX}.section.withSequence`,
          withSequence,
        )}

        {withoutSequence.length > 0 && (
          <>
            {renderSection(
              'send-claim-without-sequence',
              `${PREVIEW_PREFIX}.section.withoutSequence`,
              withoutSequence,
            )}
            <Row className={css.sectionFields}>
              <Col xs={6}>
                <FieldClaimingDate
                  label={<FormattedMessage id={`${PREVIEW_PREFIX}.field.claimExpiryDate`} />}
                  required={isDateRequired}
                  validate={validateDate}
                />
              </Col>
            </Row>
          </>
        )}

        <div className={css.section}>
          <Headline
            margin="none"
            size="large"
            tag="h3"
          >
            <FormattedMessage
              id={`${PREVIEW_PREFIX}.section.notes`}
              values={{ count: selectedCount }}
            />
          </Headline>
          <Row className={css.sectionFields}>
            <Col xs={6}>
              <Field
                component={TextArea}
                fullWidth
                label={<FormattedMessage id={`${MESSAGE_PREFIX}.field.internalNote`} />}
                name="internalNote"
                parse={identity}
              />
            </Col>
            <Col xs={6}>
              <Field
                component={TextArea}
                fullWidth
                label={<FormattedMessage id={`${MESSAGE_PREFIX}.field.externalNote`} />}
                name="externalNote"
                parse={identity}
              />
            </Col>
          </Row>
        </div>
      </form>
    );
  };

  return (
    <Modal
      aria-label={modalLabel}
      dismissible
      footer={footer}
      id="send-claim-modal"
      label={modalLabel}
      onClose={onCancel}
      open
      size="large"
    >
      {renderContent()}
    </Modal>
  );
};

SendClaimsPreviewModal.propTypes = {
  claims: PropTypes.arrayOf(PropTypes.object).isRequired,
  disabled: PropTypes.bool,
  handleSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  tenantId: PropTypes.string,
};
