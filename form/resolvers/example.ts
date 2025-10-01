// In RequestInfoCard.tsx
import { saveAsDraftRequestInfoSchema, submitRequestInfoSchema } from '../../../schemas';

const RequestInfoCard: React.FC = () => {
  const [validationSchema, setValidationSchema] = React.useState(saveAsDraftRequestInfoSchema);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(validationSchema),
  });

  const handleSave = async (data: any) => {
    setValidationSchema(saveAsDraftRequestInfoSchema);
    // Save logic
  };

  const handleSubmit = async (data: any) => {
    setValidationSchema(submitRequestInfoSchema);
    // Submit logic
  };

  return (
    <form>
      {/* Fields */}
      <button onClick={handleSubmit(handleSave)}>Save</button>
      <button onClick={handleSubmit(handleSubmit)}>Submit</button>
    </form>
  );
};
