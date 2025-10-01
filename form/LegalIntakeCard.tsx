import * as React from 'react';
import { useForm } from 'react-hook-form';
import { PrimaryButton, DefaultButton, Stack, MessageBar, MessageBarType } from '@fluentui/react';
import {
  Card,
  Header,
  Content,
  Footer,
} from '../../../components/Card';
import {
  FormItem,
  FormLabel,
  FormValue,
  FormDescription,
  FormError,
  DevExtremeSelectBox,
} from '../../../components/spForm';
import AppendingNotes from '../../../components/AppendingNotes/AppendingNotes';
import { useRequestFormStore } from '../../../stores/requestFormStore';
import { SPContext } from '../../../utilities/context';
import type { Request } from '../../../types/Request';
import './LegalIntakeCard.scss';

interface IAttorneyOption {
  id: number;
  title: string;
  email: string;
}

const LegalIntakeSummary: React.FC<{ request: Request }> = ({ request }) => {
  const [attorneyName, setAttorneyName] = React.useState<string>('');

  React.useEffect(() => {
    const loadAttorneyName = async (): Promise<void> => {
      if (request.attorney) {
        try {
          const user = await SPContext.sp.web.siteUsers.getById(request.attorney)();
          setAttorneyName(user.Title);
        } catch (error) {
          SPContext.logger.error('Failed to load attorney name', error);
          setAttorneyName('Unknown');
        }
      }
    };

    loadAttorneyName();
  }, [request.attorney]);

  return (
    <div className="legal-intake-summary">
      <div className="summary-grid">
        <div className="summary-field">
          <label>Review Audience</label>
          <div className="summary-value">{request.reviewAudience || 'N/A'}</div>
        </div>
        {request.attorney && (
          <div className="summary-field">
            <label>Assigned Attorney</label>
            <div className="summary-value">{attorneyName || 'Loading...'}</div>
          </div>
        )}
      </div>

      {request.id && (
        <div className="notes-section">
          <AppendingNotes
            listId={SPContext.listId!}
            itemId={request.id}
            fieldName="AttorneyAssignNotes"
            disabled={true}
          />
        </div>
      )}
    </div>
  );
};

const LegalIntakeEdit: React.FC<{
  control: any;
  errors: any;
  setValue: any;
}> = ({ control, errors, setValue }) => {
  const { request, updateField } = useRequestFormStore();
  const [attorneys, setAttorneys] = React.useState<IAttorneyOption[]>([]);
  const [isLoadingAttorneys, setIsLoadingAttorneys] = React.useState(false);
  const [assignmentNotes, setAssignmentNotes] = React.useState<string>('');

  const reviewAudienceOptions = React.useMemo(() => ['Legal', 'Compliance', 'Both'], []);

  React.useEffect(() => {
    loadAttorneys();
  }, []);

  const loadAttorneys = async (): Promise<void> => {
    setIsLoadingAttorneys(true);
    try {
      const group = await SPContext.sp.web.siteGroups.getByName('LW - Attorneys')();
      const users = await SPContext.sp.web.siteGroups
        .getById(group.Id)
        .users.select('Id', 'Title', 'Email')();

      const attorneyOptions: IAttorneyOption[] = users.map(user => ({
        id: user.Id,
        title: user.Title,
        email: user.Email,
      }));

      setAttorneys(attorneyOptions);

      SPContext.logger.info('Attorneys loaded successfully', {
        count: attorneyOptions.length,
      });
    } catch (error) {
      SPContext.logger.error('Failed to load attorneys', error);
      setAttorneys([]);
    } finally {
      setIsLoadingAttorneys(false);
    }
  };

  const handleFieldChange = React.useCallback((fieldName: string, value: any) => {
    setValue(fieldName, value);
    updateField(fieldName as keyof Request, value);
  }, [setValue, updateField]);

  const isAssignAttorneyStatus = request.status === 'Assign Attorney';

  return (
    <div className="legal-intake-edit">
      {!isAssignAttorneyStatus && (
        <div className="field-category">
          <div className="category-header">
            <i className="ms-Icon ms-Icon--ReviewSolid category-icon" />
            <h3 className="category-title">Review Settings</h3>
          </div>
          <div className="category-fields">
            <FormItem>
              <FormLabel>Review Audience</FormLabel>
              <FormValue>
                <DevExtremeSelectBox
                  name="reviewAudience"
                  control={control}
                  items={reviewAudienceOptions}
                  placeholder="Select review audience"
                  onValueChanged={(value) => handleFieldChange('reviewAudience', value)}
                />
              </FormValue>
              <FormDescription>
                Override the review audience if needed (Legal Admin only)
              </FormDescription>
              <FormError error={errors.reviewAudience?.message} />
            </FormItem>
          </div>
        </div>
      )}

      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--PeopleAdd category-icon" />
          <h3 className="category-title">Attorney Assignment</h3>
        </div>
        <div className="category-fields">
          {isAssignAttorneyStatus && (
            <MessageBar messageBarType={MessageBarType.info}>
              This request is pending attorney assignment by the committee. Please select an attorney to proceed.
            </MessageBar>
          )}

          <FormItem>
            <FormLabel isRequired={isAssignAttorneyStatus}>Select Attorney</FormLabel>
            <FormValue>
              <DevExtremeSelectBox
                name="attorney"
                control={control}
                dataSource={attorneys}
                displayExpr="title"
                valueExpr="id"
                placeholder={isLoadingAttorneys ? 'Loading attorneys...' : 'Select attorney'}
                searchEnabled={true}
                disabled={isLoadingAttorneys}
                onValueChanged={(value) => handleFieldChange('attorney', value)}
              />
            </FormValue>
            <FormDescription>
              {isAssignAttorneyStatus 
                ? 'Select the attorney who will review this request'
                : 'Assign an attorney directly or submit to committee for assignment'
              }
            </FormDescription>
            <FormError error={errors.attorney?.message} />
          </FormItem>

          <FormItem>
            <FormLabel>Assignment Notes</FormLabel>
            <FormValue>
              <AppendingNotes
                listId={SPContext.listId!}
                itemId={request.id}
                fieldName="AttorneyAssignNotes"
                value={assignmentNotes}
                onValueChanged={setAssignmentNotes}
                placeholder="Add notes about this assignment (optional)..."
                height={100}
                maxLength={2000}
              />
            </FormValue>
            <FormDescription>
              Provide context or special instructions for the attorney
            </FormDescription>
          </FormItem>
        </div>
      </div>
    </div>
  );
};

const LegalIntakeCard: React.FC = () => {
  const { request, assignAttorney, submitToAssignAttorney } = useRequestFormStore();
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    mode: 'onChange',
    defaultValues: {
      reviewAudience: request.reviewAudience,
      attorney: request.attorney,
    },
  });

  React.useEffect(() => {
    reset({
      reviewAudience: request.reviewAudience,
      attorney: request.attorney,
    });
  }, [request.id, reset]);

  const showCard = request.status === 'Legal Intake' || request.status === 'Assign Attorney';
  const isAssignAttorneyStatus = request.status === 'Assign Attorney';
  const isReadOnly = request.status !== 'Legal Intake' && request.status !== 'Assign Attorney';

  const selectedAttorney = watch('attorney');

  const handleAssignAttorney = async (): Promise<void> => {
    if (!selectedAttorney) {
      setError('Please select an attorney');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await assignAttorney(selectedAttorney);

      SPContext.logger.success('Attorney assigned successfully', {
        requestId: request.id,
        attorneyId: selectedAttorney,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign attorney';
      setError(errorMessage);

      SPContext.logger.error('Failed to assign attorney', err, {
        requestId: request.id,
        attorneyId: selectedAttorney,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitToCommittee = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);

    try {
      await submitToAssignAttorney();

      SPContext.logger.success('Request submitted to committee', {
        requestId: request.id,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit to committee';
      setError(errorMessage);

      SPContext.logger.error('Failed to submit to committee', err, {
        requestId: request.id,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!showCard) {
    return null;
  }

  return (
    <Card id="legal-intake-card" variant="default" allowExpand={true}>
      <Header>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <span>Legal Intake</span>
          {isAssignAttorneyStatus && (
            <span className="status-badge committee-badge">
              <i className="ms-Icon ms-Icon--Group" />
              Pending Committee Assignment
            </span>
          )}
        </Stack>
      </Header>

      <Content>
        {error && (
          <MessageBar
            messageBarType={MessageBarType.error}
            onDismiss={() => setError(null)}
            dismissButtonAriaLabel="Close"
          >
            {error}
          </MessageBar>
        )}

        {isReadOnly ? (
          <LegalIntakeSummary request={request as Request} />
        ) : (
          <LegalIntakeEdit
            control={control}
            errors={errors}
            setValue={setValue}
          />
        )}
      </Content>

      {!isReadOnly && (
        <Footer>
          <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="end">
            {!isAssignAttorneyStatus && (
              <DefaultButton
                text="Submit to Committee"
                iconProps={{ iconName: 'Group' }}
                onClick={handleSubmitToCommittee}
                disabled={isSaving}
              />
            )}
            <PrimaryButton
              text={isSaving ? 'Assigning...' : 'Assign Attorney'}
              iconProps={{ iconName: 'PeopleAdd' }}
              onClick={handleAssignAttorney}
              disabled={isSaving || !selectedAttorney}
            />
          </Stack>
        </Footer>
      )}
    </Card>
  );
};

export default LegalIntakeCard;
