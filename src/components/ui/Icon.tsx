import type { SVGProps } from 'react'

export type IconName =
  | 'dashboard'
  | 'products'
  | 'receipts'
  | 'deliveries'
  | 'transfers'
  | 'adjustments'
  | 'ledger'
  | 'menu'
  | 'close'
  | 'bell'
  | 'search'
  | 'package'
  | 'warning'
  | 'outOfStock'
  | 'arrowDown'
  | 'arrowUp'
  | 'clock'
  | 'warehouse'
  | 'activity'
  | 'chevronRight'
  | 'plus'
  | 'edit'
  | 'eye'
  | 'arrowLeft'
  | 'save'
  | 'filter'

const iconPaths: Record<IconName, string[]> = {
  dashboard: ['M3 3h7v7H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 14h7v7H3z'],
  products: ['m12 3 8 4.5-8 4.5-8-4.5z', 'm4 7.5 8 4.5 8-4.5', 'M4 12l8 4.5 8-4.5', 'M4 16.5 12 21l8-4.5'],
  receipts: ['M5 3h14v18H5z', 'M8 7h8', 'M8 11h8', 'M8 15h4'],
  deliveries: ['M3 6h11v11H3z', 'M14 10h4l3 3v4h-7z', 'M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4', 'M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4'],
  transfers: ['M7 7h13', 'm16 3 4 4-4 4', 'M17 17H4', 'm8 13-4 4 4 4'],
  adjustments: ['M4 7h10', 'M18 7h2', 'M14 4v6', 'M4 17h2', 'M10 17h10', 'M6 14v6'],
  ledger: ['M5 3h14v18H5z', 'M9 3v18', 'M12 8h4', 'M12 12h4', 'M12 16h3'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  close: ['m6 6 12 12', 'M18 6 6 18'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9', 'M10 21h4'],
  search: ['M21 21l-4.4-4.4', 'M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0'],
  package: ['m12 3 8 4.5-8 4.5-8-4.5z', 'M4 7.5V17l8 4 8-4V7.5', 'M12 12v9'],
  warning: ['M12 4 2.8 20h18.4z', 'M12 9v4', 'M12 17h.01'],
  outOfStock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', 'm8 8 8 8', 'm16 8-8 8'],
  arrowDown: ['M12 4v16', 'm6 14 6 6 6-6'],
  arrowUp: ['M12 20V4', 'm6 10 6-6 6 6'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', 'M12 6v6l4 2'],
  warehouse: ['M3 10 12 3l9 7v11H3z', 'M7 21v-7h10v7', 'M7 10h.01', 'M12 10h.01', 'M17 10h.01'],
  activity: ['M3 12h4l2-6 4 12 2-6h6'],
  chevronRight: ['m9 18 6-6-6-6'],
  plus: ['M12 5v14', 'M5 12h14'],
  edit: ['M4 20h4l11-11-4-4L4 16z', 'm13-13 4 4'],
  eye: ['M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6'],
  arrowLeft: ['M19 12H5', 'm11 18-6-6 6-6'],
  save: ['M5 3h12l2 2v16H5z', 'M8 3v6h8V3', 'M8 21v-7h8v7'],
  filter: ['M4 5h16l-6 7v6l-4 2v-8z'],
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name].map((path) => (
        <path
          d={path}
          key={path}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      ))}
    </svg>
  )
}
