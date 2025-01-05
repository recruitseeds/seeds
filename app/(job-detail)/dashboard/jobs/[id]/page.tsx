import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { jobs } from '@/data/data'

import { JobHeading } from '@/components/job-heading'
import { Bell } from 'lucide-react'

export default function Page({ params }: { params: { id: string } }) {
  const job = jobs.find((job) => job.id === params.id)
  return (
    <div>
      <JobHeading />
      <div className='relative isolate overflow-hidden px-6 py-24 sm:py-32 lg:overflow-visible lg:px-0'>
        <div className='mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-y-10'>
          <div className='lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8'>
            <div className='lg:pr-4'>
              <div className='lg:max-w-lg'>
                <p className='text-base/7 font-semibold text-accent'>
                  {job?.department}
                </p>
                <h1 className='mt-2 text-pretty text-3xl font-semibold tracking-tight sm:text-4xl'>
                  {job?.title}
                </h1>
                <p className='mt-6 text-xl/8 text-muted-foreground'>
                  Aliquet nec orci mattis amet quisque ullamcorper neque, nibh
                  sem. At arcu, sit dui mi, nibh dui, diam eget aliquam. Quisque
                  id at vitae feugiat egestas.
                </p>
              </div>
            </div>
          </div>
          <div className='-ml-12 -mt-12 p-12 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:overflow-hidden'>
            <div className='relative'>
              <Card className='rounded-none'>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription>
                    A quick overview of your jobs analytics.
                  </CardDescription>
                </CardHeader>
                <CardContent>Card content</CardContent>
              </Card>

              <div className='absolute -top-[11.5px] -left-[11.5px]'>
                <div className='flex items-center justify-center w-6 h-6 rounded-full  text-foreground'>
                  <Plus />
                </div>
              </div>
              <div className='absolute -bottom-[11.5px] -left-[11.5px]'>
                <div className='flex items-center justify-center w-6 h-6 rounded-full  text-foreground'>
                  <Plus />
                </div>
              </div>
              <div className='absolute -top-[11.5px] -right-[11.5px]'>
                <div className='flex items-center justify-center w-6 h-6 rounded-full  text-foreground'>
                  <Plus />
                </div>
              </div>
              <div className='absolute -bottom-[11.5px] -right-[11.5px]'>
                <div className='flex items-center justify-center w-6 h-6 rounded-full  text-foreground'>
                  <Plus />
                </div>
              </div>
            </div>
          </div>

          <div className='lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8'>
            <div className='lg:pr-4'>
              <div className='max-w-xl text-base/7 text-muted-foreground lg:max-w-lg'>
                <p>
                  Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget
                  risus enim. Mattis mauris semper sed amet vitae sed turpis id.
                  Id dolor praesent donec est. Odio penatibus risus viverra
                  tellus varius sit neque erat velit. Faucibus commodo massa
                  rhoncus, volutpat. Dignissim sed eget risus enim. Mattis
                  mauris semper sed amet vitae sed turpis id.
                </p>
                <ul
                  role='list'
                  className='mt-8 space-y-8 text-muted-foreground'>
                  <li className='flex gap-x-3'>
                    <Bell
                      aria-hidden='true'
                      className='mt-1 size-5 flex-none text-accent'
                    />
                    <span>
                      <strong className='font-semibold '>
                        Push to deploy.
                      </strong>{' '}
                      Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                      Maiores impedit perferendis suscipit eaque, iste dolor
                      cupiditate blanditiis ratione.
                    </span>
                  </li>
                  <li className='flex gap-x-3'>
                    <Bell
                      aria-hidden='true'
                      className='mt-1 size-5 flex-none text-accent'
                    />
                    <span>
                      <strong className='font-semibold'>
                        SSL certificates.
                      </strong>{' '}
                      Anim aute id magna aliqua ad ad non deserunt sunt. Qui
                      irure qui lorem cupidatat commodo.
                    </span>
                  </li>
                  <li className='flex gap-x-3'>
                    <Bell
                      aria-hidden='true'
                      className='mt-1 size-5 flex-none text-accent'
                    />
                    <span>
                      <strong className='font-semibold '>
                        Database backups.
                      </strong>{' '}
                      Ac tincidunt sapien vehicula erat auctor pellentesque
                      rhoncus. Et magna sit morbi lobortis.
                    </span>
                  </li>
                </ul>
                <p className='mt-8'>
                  Et vitae blandit facilisi magna lacus commodo. Vitae sapien
                  duis odio id et. Id blandit molestie auctor fermentum
                  dignissim. Lacus diam tincidunt ac cursus in vel. Mauris
                  varius vulputate et ultrices hac adipiscing egestas. Iaculis
                  convallis ac tempor et ut. Ac lorem vel integer orci.
                </p>
                <h2 className='mt-16 text-2xl font-bold tracking-tight'>
                  No server? No problem.
                </h2>
                <p className='mt-6'>
                  Id orci tellus laoreet id ac. Dolor, aenean leo, ac etiam
                  consequat in. Convallis arcu ipsum urna nibh. Pharetra,
                  euismod vitae interdum mauris enim, consequat vulputate nibh.
                  Maecenas pellentesque id sed tellus mauris, ultrices mauris.
                  Tincidunt enim cursus ridiculus mi. Pellentesque nam sed
                  nullam sed diam turpis ipsum eu a sed convallis diam.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Plus = () => (
  <svg
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    className='stroke-muted-foreground'
    xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M5 12H12M19 12H12M12 12V5M12 12V19'
      strokeWidth='.75'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)
