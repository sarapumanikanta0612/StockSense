import type { IconName } from '../components/ui/Icon'
import { Icon } from '../components/ui/Icon'
import { PageHeader } from '../components/ui/PageHeader'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: IconName
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div className="page placeholder-page">
      <PageHeader eyebrow="Workspace" title={title} description={description} />
      <section className="panel placeholder-card">
        <span className="placeholder-card__icon"><Icon name={icon} size={28} /></span>
        <span className="status-badge status-badge--neutral">UI placeholder</span>
        <h2>{title} workspace is coming next</h2>
        <p>
          The navigation and responsive page foundation are ready. Workflow UI will be added here without implementing backend or inventory business logic.
        </p>
      </section>
    </div>
  )
}
