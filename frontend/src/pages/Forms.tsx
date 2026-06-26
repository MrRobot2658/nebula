import { useEffect, useState } from 'react'
import { Eye, FileText, Plus, Send, Trash2 } from 'lucide-react'
import { createForm, getForm, getForms, submitForm } from '../api/client'
import type { FormDetail, FormField, Form as FormType } from '../api/types'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import FormRenderer from '../components/FormRenderer'
import { EmptyState, Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

const FIELD_TYPES = ['text', 'phone', 'email', 'number', 'textarea']

interface BuilderField {
  key: string
  label: string
  type: string
  required: boolean
}

export default function Forms() {
  const [forms, setForms] = useState<FormType[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<FormDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewForm, setPreviewForm] = useState<FormType | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [name, setName] = useState('')
  const [channelKey, setChannelKey] = useState('')
  const [fields, setFields] = useState<BuilderField[]>([
    { key: 'name', label: '姓名', type: 'text', required: true },
    { key: 'phone', label: '手机', type: 'phone', required: true },
  ])

  const load = () => {
    setLoading(true)
    getForms()
      .then(setForms)
      .catch(() => setForms([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openDetail = (id: number) => {
    setDetailOpen(true)
    setLoadingDetail(true)
    getForm(id)
      .then(setSelected)
      .catch(() => setSelected(null))
      .finally(() => setLoadingDetail(false))
  }

  const openPreview = (form: FormType) => {
    setPreviewForm(form)
    setPreviewOpen(true)
  }

  const addField = () =>
    setFields((f) => [...f, { key: '', label: '', type: 'text', required: false }])
  const removeField = (i: number) => setFields((f) => f.filter((_, idx) => idx !== i))
  const updateField = (i: number, patch: Partial<BuilderField>) =>
    setFields((f) => f.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))

  const submit = async () => {
    if (!name.trim()) return
    const valid = fields.filter((f) => f.key.trim() && f.label.trim())
    setSubmitting(true)
    try {
      await createForm({
        name: name.trim(),
        channel_key: channelKey || undefined,
        fields: valid,
      })
      setOpen(false)
      setName('')
      setChannelKey('')
      setFields([
        { key: 'name', label: '姓名', type: 'text', required: true },
        { key: 'phone', label: '手机', type: 'phone', required: true },
      ])
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const simulate = async (form: { id: number; channel_key?: string | null }) => {
    setSimulating(true)
    try {
      const sampleName = `表单访客_${Date.now().toString().slice(-5)}`
      const phone = `13${Math.floor(100000000 + Math.random() * 899999999)}`
      await submitForm(form.id, {
        data: { name: sampleName, phone },
        name: sampleName,
        phone,
        channel_key: form.channel_key || undefined,
      })
      openDetail(form.id)
    } finally {
      setSimulating(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="表单"
        description="搭建线索收集表单，沉淀跨渠道留资"
        action={
          <Button data-testid="new-form-button" onClick={() => setOpen(true)}>
            <Plus size={16} /> 新建表单
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : forms.length === 0 ? (
        <EmptyState text="暂无表单" />
      ) : (
        <div
          data-testid="form-table"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {forms.map((f) => (
            <div
              key={f.id}
              data-testid="form-row"
              onClick={() => openDetail(f.id)}
              className="flex h-full cursor-pointer flex-col rounded-2xl bg-white border border-slate-200/70 shadow-card p-5 transition hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <FileText size={16} />
                  </div>
                  <div className="font-medium text-slate-800">{f.name}</div>
                </div>
                {f.channel_key ? <Badge tone="blue">{f.channel_key}</Badge> : null}
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                <span>
                  字段 <span className="font-semibold text-slate-700">{f.fields.length}</span>
                </span>
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">{formatDateTime(f.created_at)}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    data-testid="preview-form-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openPreview(f)
                    }}
                  >
                    <Eye size={13} /> 预览
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      simulate(f)
                    }}
                    disabled={simulating}
                  >
                    <Send size={13} /> {simulating ? '提交中…' : '模拟提交'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="表单详情"
      >
        {loadingDetail ? (
          <Loading />
        ) : !selected ? (
          <EmptyState text="加载失败" />
        ) : (
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-slate-800">{selected.name}</div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  data-testid="preview-form-button"
                  onClick={() => openPreview(selected)}
                >
                  <Eye size={13} /> 预览
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => simulate(selected)}
                  disabled={simulating}
                >
                  <Send size={13} /> {simulating ? '提交中…' : '模拟提交'}
                </Button>
              </div>
            </div>

            <div className="mt-3 text-xs font-medium text-slate-400">字段</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {selected.fields.map((field: FormField) => (
                <Badge key={field.key} tone="brand">
                  {field.label}
                  {field.required ? ' *' : ''}
                </Badge>
              ))}
            </div>

            <div className="mt-4 text-xs font-medium text-slate-400">
              留资记录（{selected.submissions.length}）
            </div>
            <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
              {selected.submissions.length === 0 ? (
                <div className="text-sm text-slate-400">暂无提交</div>
              ) : (
                selected.submissions.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs"
                  >
                    <div className="text-slate-600 break-words">{JSON.stringify(s.data)}</div>
                    <div className="mt-1 text-slate-400">{formatDateTime(s.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="表单预览"
      >
        {previewForm ? (
          <FormRenderer form={previewForm} />
        ) : (
          <EmptyState text="无可预览的表单" />
        )}
      </Modal>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建表单"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={submit} disabled={submitting || !name.trim()}>
              {submitting ? '保存中…' : '保存'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="form-label">表单名称 *</span>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如 预约咨询表单"
            />
          </div>
          <div>
            <span className="form-label">渠道 Key</span>
            <input
              className="form-input"
              value={channelKey}
              onChange={(e) => setChannelKey(e.target.value)}
              placeholder="可选，如 web / wechat"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="form-label mb-0">字段</span>
              <Button size="sm" variant="ghost" onClick={addField}>
                <Plus size={13} /> 添加字段
              </Button>
            </div>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="form-input flex-1"
                    value={f.key}
                    onChange={(e) => updateField(i, { key: e.target.value })}
                    placeholder="key"
                  />
                  <input
                    className="form-input flex-1"
                    value={f.label}
                    onChange={(e) => updateField(i, { label: e.target.value })}
                    placeholder="标签"
                  />
                  <select
                    className="form-input w-24"
                    value={f.type}
                    onChange={(e) => updateField(i, { type: e.target.value })}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => updateField(i, { required: e.target.checked })}
                    />
                    必填
                  </label>
                  <button
                    onClick={() => removeField(i)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
