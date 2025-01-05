import { OfferAcceptanceChart } from '@/components/offer-acceptance-chart'
import { TimeToFillChart } from '@/components/time-to-fill-chart'
import { ActiveCandidatesChart } from '@/components/active-candidates-chart'
import { data } from '@/data/data'
import { columns } from '../../../components/columns'
import { DataTable } from '../../../components/data-table'

export default function Page() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
      <div className='grid auto-rows-min gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'>
        <TimeToFillChart />
        <ActiveCandidatesChart />
        <OfferAcceptanceChart />
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  )
}
