import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { submitForm } from '../api/client'
import type { Form, FormField } from '../api/types'
import Button from './Button'

interface FormRendererProps {
  form: Form
  /** data-testid for the outer wrapper */
  testId?: string
  /** data-testid for the submit button */
  submitTestId?: string
}

function inputType(fieldType: string): string {
  switch (fieldType) {
    case 'tel':
    case 'phone':
      return 'tel'
    case 'email':
      return 'email'
    case 'number':
      return 'number'
    default:
      return 'text'
  }
}

export default function FormRenderer({
  form,
  testId = 'form-preview',
  submitTestId = 'form-preview-submit',
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const fields = useMemo<FormField[]>(() => form.fields ?? [], [form])

  const setValue = (key: string, value: string) =>
    setValues((v) => ({ ...v, [key]: value }))

  const submit = async () => {
    setSubmitting(true)
    try {
      const data: Record<string, string> = { ...values }
      await submitForm(form.id, {
        data,
        name: values.name || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        channel_key: form.channel_key || undefined,
      })
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div
        data-testid={testId}
        className="flex flex-col items-center justify-center gap-3 py-10 text-center"
      >
        <CheckCircle2 className="text-emerald-500" size={40} />
        <div className="text-base font-semibold text-slate-800">提交成功，已生成线索</div>
        <div className="text-sm text-slate-500">我们的顾问会尽快与您联系</div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setDone(false)
            setValues({})
          }}
        >
          再填一次
        </Button>
      </div>
    )
  }

  return (
    <div data-testid={testId} className="space-y-4">
      <h3 className="text-base font-semibold text-slate-800">{form.name}</h3>
      <div className="space-y-3">
        {fields.length === 0 ? (
          <div className="text-sm text-slate-400">该表单暂无字段</div>
        ) : (
          fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {field.label}
                {field.required ? <span className="text-rose-500"> *</span> : null}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="form-input min-h-[88px]"
                  value={values[field.key] ?? ''}
                  required={field.required}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  placeholder={`请输入${field.label}`}
                />
              ) : (
                <input
                  className="form-input"
                  type={inputType(field.type)}
                  value={values[field.key] ?? ''}
                  required={field.required}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  placeholder={`请输入${field.label}`}
                />
              )}
            </div>
          ))
        )}
      </div>
      <Button
        className="w-full"
        data-testid={submitTestId}
        onClick={submit}
        disabled={submitting}
      >
        {submitting ? '提交中…' : '提交'}
      </Button>
    </div>
  )
}
