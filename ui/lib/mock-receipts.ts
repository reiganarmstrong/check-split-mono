import {
  CalendarDays,
  Camera,
  LayoutGrid,
  ReceiptText,
  ScanSearch,
  Users,
  type LucideIcon,
} from "lucide-react"

export type ReceiptLineItem = {
  label: string
  amount: string
}

export type MockReceipt = {
  id: string
  merchant: string
  date: string
  amount: string
  people: number
  status: string
  rotation: number
  totalOffset: number
  location: string
  scannedAt: string
  note: string
  items: ReceiptLineItem[]
}

export type DashboardFact = {
  label: string
  value: string
  icon: LucideIcon
}

export const mockReceipts: MockReceipt[] = [
  {
    id: "crudo-corner",
    merchant: "Crudo Corner",
    date: "Apr 4",
    amount: "$86.20",
    people: 4,
    status: "Ready to split",
    rotation: -2,
    totalOffset: 4,
    location: "Williamsburg",
    scannedAt: "April 4 at 8:41 PM",
    note: "Shared seafood dinner with a clean scan and all items parsed.",
    items: [
      { label: "Shared plates", amount: "$24.00" },
      { label: "Drinks", amount: "$19.50" },
      { label: "Mains", amount: "$32.70" },
    ],
  },
  {
    id: "marigold-brunch",
    merchant: "Marigold Brunch",
    date: "Apr 1",
    amount: "$128.50",
    people: 5,
    status: "2 items unclaimed",
    rotation: 1.5,
    totalOffset: -4,
    location: "Greenpoint",
    scannedAt: "April 1 at 11:14 AM",
    note: "Large brunch check with two items still waiting to be claimed.",
    items: [
      { label: "Coffee round", amount: "$18.00" },
      { label: "Brunch plates", amount: "$72.50" },
      { label: "Pastries", amount: "$21.00" },
    ],
  },
  {
    id: "island-noodle",
    merchant: "Island Noodle",
    date: "Mar 29",
    amount: "$54.90",
    people: 3,
    status: "Paid out",
    rotation: -1,
    totalOffset: 8,
    location: "East Village",
    scannedAt: "March 29 at 7:22 PM",
    note: "Quick dinner split already completed for the whole group.",
    items: [
      { label: "Noodle bowls", amount: "$28.00" },
      { label: "Appetizers", amount: "$11.40" },
      { label: "Tea + dessert", amount: "$9.50" },
    ],
  },
  {
    id: "night-market",
    merchant: "Night Market Hall",
    date: "Mar 23",
    amount: "$211.84",
    people: 7,
    status: "Reviewing scan",
    rotation: 2,
    totalOffset: 0,
    location: "Long Island City",
    scannedAt: "March 23 at 9:08 PM",
    note: "Dense multi-stall receipt. A few line items still need scan review.",
    items: [
      { label: "Food stalls", amount: "$134.20" },
      { label: "Drinks", amount: "$41.64" },
      { label: "Dessert run", amount: "$18.00" },
    ],
  },
  {
    id: "aperitivo-lane",
    merchant: "Aperitivo Lane",
    date: "Mar 18",
    amount: "$73.12",
    people: 2,
    status: "Ready to split",
    rotation: -1.5,
    totalOffset: -8,
    location: "SoHo",
    scannedAt: "March 18 at 6:47 PM",
    note: "Small two-person check with cocktails and shared snacks.",
    items: [
      { label: "Spritzes", amount: "$28.00" },
      { label: "Snacks", amount: "$19.12" },
      { label: "Dessert", amount: "$12.00" },
    ],
  },
  {
    id: "fieldhouse-tacos",
    merchant: "Fieldhouse Tacos",
    date: "Mar 11",
    amount: "$94.00",
    people: 6,
    status: "Paid out",
    rotation: 1,
    totalOffset: 4,
    location: "Bushwick",
    scannedAt: "March 11 at 8:03 PM",
    note: "Team dinner with everyone already assigned and settled.",
    items: [
      { label: "Taco trays", amount: "$48.00" },
      { label: "Sides", amount: "$14.00" },
      { label: "Drinks", amount: "$22.00" },
    ],
  },
]

export const dashboardStats: DashboardFact[] = [
  { label: "Scans this month", value: "18", icon: ScanSearch },
  { label: "Ready to split", value: "7", icon: LayoutGrid },
  { label: "Groups synced", value: "23", icon: Users },
]

export const archiveDetails: DashboardFact[] = [
  { label: "Latest scan", value: "12 min ago", icon: Camera },
  { label: "Archive window", value: "Last 90 days", icon: CalendarDays },
  { label: "Thumbnail mode", value: "Receipt-first", icon: ReceiptText },
]

export function getReceiptAccent(status: string) {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes("paid out")) {
    return "from-primary/28 via-primary/12 to-transparent"
  }

  if (
    normalizedStatus.includes("unclaimed") ||
    normalizedStatus.includes("reviewing scan") ||
    normalizedStatus.includes("not assigned")
  ) {
    return "from-secondary/24 via-secondary/10 to-transparent"
  }

  return "from-accent/30 via-accent/12 to-transparent"
}

export function getMockReceipt(receiptId: string) {
  return mockReceipts.find((receipt) => receipt.id === receiptId) ?? null
}
