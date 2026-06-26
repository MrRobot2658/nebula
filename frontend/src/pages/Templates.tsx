import { useEffect, useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import { createTemplate, getTemplates } from '../api/client'
import type { Template } from '../api/types'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { EmptyState, Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: '',
    channel_key: '',
    content: '',
  })

  const load = () => {
    setLoading(true)
    getTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = async () => {
    if (!form.name.trim() || !form.content.trim()) return
    setSubmitting(true)
    try {
      await createTemplate({
        name: form.name.trim(),
        category: form.category.trim() || '通用',
        channel_key: form.channel_key || undefined,
        content: form.content,
      })
      setOpen(false)
      setForm({ name: '', category: '', channel_key: '', content: '' })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="模板库"
        description="复用消息模板，支持 {{变量}} 个性化替换"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> 新建模板
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : templates.length === 0 ? (
        <EmptyState text="暂无模板" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id} testId="template-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <FileText size={16} />
                  </div>
                  <div className="font-medium text-slate-800">{t.name}</div>
                </div>
                <Badge tone="brand">{t.category}</Badge>
              </div>
              <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-xs text-slate-600 max-h-32 overflow-y-auto">
                {t.content}
              </pre>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>{t.channel_key ? `渠道 ${t.channel_key}` : '全渠道'}</span>
                <span>{formatDateTime(t.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建模板"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={submit} disabled={submitting || !form.name.trim() || !form.content.trim()}>
              {submitting ? '保存中…' : '保存'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="form-label">模板名称 *</span>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如 欢迎语"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="form-label">分类</span>
              <input
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="如 营销 / 通知"
              />
            </div>
            <div>
              <span className="form-label">渠道 Key</span>
              <input
                className="form-input"
                value={form.channel_key}
                onChange={(e) => setForm({ ...form, channel_key: e.target.value })}
                placeholder="可选"
              />
            </div>
          </div>
          <div>
            <span className="form-label">内容 *</span>
            <textarea
              className="form-input min-h-[120px]"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="您好 {{name}}，欢迎使用…"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
