Good news: the toolkit already supports this, you just need the right wiring. Two patterns work depending on whether your fields are toolkit-provided or your own.

The core pattern (works regardless of class-component nesting depth):

One function-component top-level that owns the form — even if your real top-level is a class. It can be a tiny const FormShell: React.FC = () => { const form = useForm<T>(...); return <FormProvider control={form.control}>{children}</FormProvider> } wrapper around your class tree.
<FormProvider control={control}> at the top — that's the load-bearing step. Every SP/DevExtreme field inside the tree (no matter how deeply nested in class components) auto-picks up control via context. No prop drilling needed.
<FormErrorSummary /> next to your submit area — reads errors from the same FormContext. Click-to-scroll works because each toolkit field auto-registers its ref with formContext.registry.
