import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Crown, TrendingUp } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  adjustMemberPoints,
  createMember,
  getCustomer,
  getMember,
} from '../api/client'
import type { CustomerDetail, MemberDetail } from '../api/types'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import { ErrorState, Loading } from '../components/States'
import { formatDateTime, scoreColor } from '../lib/format'

type Tone = 'slate' | 'brand' | 'amber' | 'blue'

function levelTone(level: string): Tone {
  if (level.includes('钻')) return 'brand'
  if (level.includes('金')) return 'amber'
  if (level.includes('银')) return 'blue'
  return 'slate'
}

function progressPct(points: number, toNext: number): number {
  const total = points + toNext
  if (total <= 0) return 100
  return Math.min(100, Math.round((points / total) * 100))
}

export default function MemberProfile() {
  const { customerId } = useParams<{ customerId: string }>()
  const id = Number(customerId)

  const [member, setMember] = useState<MemberDetail | null>(null)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notMember, setNotMember] = useState(false)
  const [error, setError] = useState(false)

  const [delta, setDelta] = useState(100)
  const [reason, setReason] = useState('活动奖励')
  const [adjusting, setAdjusting] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  const loadMember = useCallback(async () => {
    try {
      const m = await getMember(id)
      setMember(m)
      setNotMember(false)
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        setMember(null)
        setNotMember(true)
      } else {
        throw e
      }
    }
  }, [id])

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    Promise.all([
      loadMember(),
      getCustomer(id)
        .then(setCustomer)
        .catch(() => setCustomer(null)),
    ])
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id, loadMember])

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError(true)
      setLoading(false)
      return
    }
    load()
  }, [id, load])

  const adjust = async () => {
    if (!member || !delta) return
    setAdjusting(true)
    try {
      await adjustMemberPoints(member.customer_id, { delta: Number(delta), reason })
      await loadMember()
    } finally {
      setAdjusting(false)
    }
  }

  const enroll = async () => {
    setEnrolling(true)
    try {
      await createMember(id)
      await loadMember()
    } finally {
      setEnrolling(false)
    }
  }

  const name = member?.customer_name || customer?.name || `客户 #${id}`

  const backLink = (
    <Link
      to="/members"
      className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft size={16} /> 返回会员列表
    </Link>
  )

  if (loading) {
    return (
      <div>
        {backLink}
        <Loading />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        {backLink}
        <ErrorState text="加载失败，请稍后重试" />
      </div>
    )
  }

  if (notMember) {
    return (
      <div>
        {backLink}
        <Card>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Avatar name={name} size="lg" />
            <div className="text-base font-semibold text-slate-800">{name}</div>
            <div className="text-sm text-slate-500">该客户尚未开通会员</div>
            <Button data-testid="enroll-member-button" onClick={enroll} disabled={enrolling}>
              <Crown size={15} /> {enrolling ? '开通中…' : '开通会员'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!member) {
    return (
      <div>
        {backLink}
        <ErrorState text="未找到会员信息" />
      </div>
    )
  }

  return (
    <div data-testid="member-profile">
      {backLink}

      {/* Header */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-800">{name}</h1>
              <Badge tone={levelTone(member.level)}>
                <span data-testid="member-profile-level" className="inline-flex items-center">
                  <Crown size={11} className="mr-1" />
                  {member.level}
                </span>
              </Badge>
            </div>
            <div className="mt-1 text-sm text-slate-500">会员积分 {member.points}</div>
          </div>
          <div className="w-full sm:w-64">
            {member.next_level ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>距 {member.next_level}</span>
                  <span>还需 {member.points_to_next}</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${progressPct(member.points, member.points_to_next)}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="text-xs text-amber-600">已达最高等级</div>
            )}
          </div>
        </div>
      </Card>

      {/* 画像 grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card title="基本信息">
          <dl className="space-y-2.5 text-sm">
            <Row label="来源渠道" value={customer?.source_channel || '-'} />
            <Row label="阶段" value={customer?.stage || '-'} />
            <Row label="手机号" value={customer?.phone || '-'} />
            <Row label="邮箱" value={customer?.email || '-'} />
            <Row label="加入时间" value={formatDateTime(member.joined_at)} />
          </dl>
        </Card>

        <Card title="标签">
          <div className="flex flex-wrap gap-1.5">
            {customer && customer.tags.length > 0 ? (
              customer.tags.map((t) => (
                <Badge key={t} tone="brand">
                  {t}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-slate-400">暂无标签</span>
            )}
          </div>
        </Card>

        <Card title="营销评分">
          <div className="text-2xl font-semibold text-slate-800">
            {customer ? customer.score : '-'}
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${scoreColor(customer?.score ?? 0)}`}
              style={{ width: `${Math.min(100, Math.max(0, customer?.score ?? 0))}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400">客户互动行为评分</div>
        </Card>

        <Card title="会员积分">
          <div className="text-2xl font-semibold text-slate-800">{member.points}</div>
          <div className="mt-1">
            <Badge tone={levelTone(member.level)}>
              <Crown size={11} className="mr-1" />
              {member.level}
            </Badge>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {member.next_level ? `距 ${member.next_level} 还需 ${member.points_to_next} 分` : '已达最高等级'}
          </div>
        </Card>
      </div>

      {/* 积分流水 + 调整积分 */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="调整积分">
          <div className="space-y-3">
            <div>
              <span className="form-label">积分变动</span>
              <input
                type="number"
                className="form-input"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
              />
            </div>
            <div>
              <span className="form-label">原因</span>
              <input
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="如 活动奖励 / 积分兑换"
              />
            </div>
            <Button
              className="w-full"
              data-testid="adjust-points-button"
              onClick={adjust}
              disabled={adjusting || !delta}
            >
              {adjusting ? '处理中…' : '应用调整'}
            </Button>
          </div>
        </Card>

        <Card title={`积分流水（${member.transactions.length}）`} className="lg:col-span-2">
          <div data-testid="member-profile-transactions" className="space-y-2 max-h-96 overflow-y-auto">
            {member.transactions.length === 0 ? (
              <div className="text-sm text-slate-400">暂无流水</div>
            ) : (
              member.transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      size={15}
                      className={t.delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}
                    />
                    <div>
                      <div className="text-slate-600">{t.reason}</div>
                      <div className="text-xs text-slate-400">
                        {formatDateTime(t.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        t.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {t.delta >= 0 ? '+' : ''}
                      {t.delta}
                    </div>
                    <div className="text-xs text-slate-400">余 {t.balance_after}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-700 font-medium truncate max-w-[60%] text-right">{value}</dd>
    </div>
  )
}
