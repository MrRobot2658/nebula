import type { ChatView } from '../../api/types'
import DashboardCard from './DashboardCard'
import CustomersCard from './CustomersCard'
import ProfileCard from './ProfileCard'
import ChannelsCard from './ChannelsCard'
import FlowsCard from './FlowsCard'
import MembersCard from './MembersCard'
import ListCard from './ListCard'

// 渲染指令分发：把 assistant 返回的 view 映射到对应内联卡片。
export default function ViewCard({ view }: { view: ChatView }) {
  switch (view.type) {
    case 'dashboard':
      return <DashboardCard />
    case 'customers':
      return <CustomersCard query={view.query} />
    case 'profile':
      return <ProfileCard customer_id={view.customer_id} />
    case 'channels':
      return <ChannelsCard />
    case 'flows':
      return <FlowsCard />
    case 'members':
      return <MembersCard />
    case 'scoring':
    case 'events':
    case 'templates':
    case 'campaigns':
    case 'forms':
    case 'landing':
    case 'posters':
    case 'webinars':
    case 'offline':
      return <ListCard type={view.type} />
    default:
      return null
  }
}
