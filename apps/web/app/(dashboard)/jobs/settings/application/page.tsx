import ApplicationFormSettingsServer from './server-page'

export default function ApplicationFormSettingsPage({
  searchParams,
}: {
  searchParams: { template?: string }
}) {
  return <ApplicationFormSettingsServer searchParams={searchParams} />
}