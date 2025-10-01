import * as React from 'react';
import { Text } from '@fluentui/react';
import { useRequestFormStore } from '../../stores/requestFormStore';
import type { RequestType } from '../../types/Request';

interface ITypeCardProps {
  type: RequestType;
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

const TypeCard: React.FC<ITypeCardProps> = ({ type, icon, title, description, onClick }) => {
  return (
    <div className="type-card" onClick={onClick} role="button" tabIndex={0} onKeyPress={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}>
      <div className="type-icon">
        <i className={`ms-Icon ms-Icon--${icon}`} />
      </div>
      <Text className="type-title">{title}</Text>
      <Text className="type-description">{description}</Text>
    </div>
  );
};

const RequestTypeSelector: React.FC = () => {
  const { setRequestType } = useRequestFormStore();

  const handleTypeSelect = (type: RequestType): void => {
    setRequestType(type);
  };

  return (
    <div className="request-type-selector">
      <h2>Select Request Type</h2>
      <Text variant="large" block style={{ marginBottom: '32px', color: 'var(--neutralSecondary, #605e5c)' }}>
        Choose the type of review you need to get started
      </Text>

      <div className="type-cards">
        <TypeCard
          type="Communication"
          icon="Mail"
          title="Communication"
          description="Marketing communications, brochures, emails, and promotional materials"
          onClick={() => handleTypeSelect('Communication')}
        />
        <TypeCard
          type="General Review"
          icon="DocumentSearch"
          title="General Review"
          description="Contracts, policies, agreements, and general legal documents"
          onClick={() => handleTypeSelect('General Review')}
        />
        <TypeCard
          type="IMA Review"
          icon="Financial"
          title="IMA Review"
          description="Investment Management Agreement reviews and related financial documents"
          onClick={() => handleTypeSelect('IMA Review')}
        />
      </div>
    </div>
  );
};

export default RequestTypeSelector;
