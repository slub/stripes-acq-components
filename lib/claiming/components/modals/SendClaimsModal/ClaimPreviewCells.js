import {
  FormattedDate,
  FormattedMessage,
} from 'react-intl';

import {
  dayjs,
  Icon,
  NoValue,
} from '@folio/stripes/components';

import { CLAIM_PREVIEW_STATUS } from '../../../utils';

const MESSAGE_PREFIX = 'stripes-acq-components.claiming.modal.sendClaim.preview';

const formatConfig = (config) => {
  const { configName, transmissionMethod } = config.exportTypeSpecificParameters?.vendorEdiOrdersExportConfig ?? {};

  return [transmissionMethod, configName].filter(Boolean).join(' · ');
};

// Shared by the list and the single piece view, each takes a preview row

export const renderNextStage = ({ isCompleted, nextStage, stageCount }) => {
  if (isCompleted) {
    return <FormattedMessage id={`${MESSAGE_PREFIX}.nextStage.completed`} values={{ count: stageCount }} />;
  }

  if (!nextStage) return <NoValue />;

  return (
    <FormattedMessage
      id={`${MESSAGE_PREFIX}.nextStage.value`}
      values={{ name: nextStage.stage.name, number: nextStage.number, count: nextStage.count }}
    />
  );
};

export const renderSentVia = ({ configs, status }) => {
  if (status === CLAIM_PREVIEW_STATUS.manual) return <FormattedMessage id={`${MESSAGE_PREFIX}.sentVia.manual`} />;

  if (!configs.length) return <NoValue />;

  return (
    <div>
      {configs.map((config) => <div key={config.id}>{formatConfig(config)}</div>)}
    </div>
  );
};

export const renderClaimExpiryDate = ({ hasSequence, isSelectable, nextStage }) => {
  if (!isSelectable) return <NoValue />;

  // The stage sets the date, the date field only applies to pieces without a claim sequence
  if (nextStage) return <FormattedDate value={dayjs().add(nextStage.stage.interval, 'days').toDate()} />;

  if (!hasSequence) return <FormattedMessage id={`${MESSAGE_PREFIX}.claimExpiryDate.asEntered`} />;

  return <NoValue />;
};

export const renderStatus = ({ status }) => {
  const message = <FormattedMessage id={`${MESSAGE_PREFIX}.status.${status}`} />;

  if (status === CLAIM_PREVIEW_STATUS.sentMultiple) {
    return (
      <Icon
        icon="exclamation-circle"
        size="small"
        status="warn"
      >
        {message}
      </Icon>
    );
  }

  return message;
};
