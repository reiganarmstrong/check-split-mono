type ReceiptSummaryShareItemDetail = {
  amountLabel: string
  description: string
  ratioLabel: string
  subtotalLabel: string
}

type ReceiptSummaryShareGroup = {
  amountLabel: string
  amountValue: number
  discountLabel: string
  feeLabel: string
  groupName: string
  isPaid: boolean
  itemDetails: ReceiptSummaryShareItemDetail[]
  itemsLabel: string
  taxLabel: string
  tipLabel: string
}

export type ReceiptSummaryShareData = {
  discountLabel: string
  feeLabel: string
  groups: ReceiptSummaryShareGroup[]
  locationName: string
  merchantName: string
  paidGroupCount: number
  receiptOccurredAt: string
  subtotalLabel: string
  taxLabel: string
  tipLabel: string
  totalLabel: string
  unpaidGroupCount: number
}

type SummaryMetricRow = {
  label: string
  value: string
}

type StatusPalette = {
  accent: string
  fill: string
  stroke: string
  text: string
}

const SHARE_IMAGE_WIDTH = 1200
const CANVAS_SIDE_PADDING = 56
const SURFACE_RADIUS = 34
const HEADER_FONT =
  "700 74px 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
const GROUP_VALUE_FONT =
  "700 36px 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
const BRAND_FONT =
  "700 22px 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif"
const SECTION_LABEL_FONT =
  "600 22px 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif"
const LABEL_FONT =
  "500 21px 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif"
const VALUE_FONT =
  "600 26px 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif"
const BODY_FONT =
  "500 22px 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif"
const SMALL_FONT =
  "500 18px 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif"
const MICRO_FONT =
  "600 16px 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif"
const ITEM_META_FONT =
  "500 17px 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif"
const GROUP_TITLE_FONT =
  "600 34px 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif"
const APP_BACKGROUND = "#f5f6f0"
const APP_FOREGROUND = "#13181f"
const APP_MUTED = "rgba(19, 24, 31, 0.62)"
const APP_LINE = "rgba(19, 24, 31, 0.12)"
const APP_LINE_STRONG = "rgba(19, 24, 31, 0.18)"
const APP_PANEL = "#fbfbf8"
const APP_SURFACE = "#ffffff"
const APP_PRIMARY = "#2337d7"
const APP_ACCENT = "#79d2bc"
const APP_ACCENT_SOFT = "rgba(121, 210, 188, 0.16)"
const APP_ACCENT_STROKE = "rgba(48, 126, 108, 0.18)"
const APP_ACCENT_FOREGROUND = "#10211b"
const APP_UNPAID = "#d97706"
const APP_UNPAID_SOFT = "#fef3c7"
const APP_UNPAID_STROKE = "rgba(180, 83, 9, 0.18)"
const APP_UNPAID_FOREGROUND = "#b45309"

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatShareDateTime(value: string) {
  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date not available"
  }

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate)

  const hasExplicitTime =
    /T\d{2}:\d{2}/.test(value) ||
    /\d{1,2}:\d{2}/.test(value) ||
    parsedDate.getHours() !== 0 ||
    parsedDate.getMinutes() !== 0

  if (!hasExplicitTime) {
    return dateLabel
  }

  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate)

  return `${dateLabel} • ${timeLabel}`
}

function waitForFonts() {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return Promise.resolve()
  }

  return document.fonts.ready.catch(() => undefined)
}

function createCanvasElement(width: number, height: number) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: CanvasFillStrokeStyles["fillStyle"],
) {
  const clampedRadius = Math.max(0, Math.min(radius, width / 2, height / 2))

  context.beginPath()
  context.moveTo(x + clampedRadius, y)
  context.lineTo(x + width - clampedRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + clampedRadius)
  context.lineTo(x + width, y + height - clampedRadius)
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - clampedRadius,
    y + height,
  )
  context.lineTo(x + clampedRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - clampedRadius)
  context.lineTo(x, y + clampedRadius)
  context.quadraticCurveTo(x, y, x + clampedRadius, y)
  context.closePath()
  context.fillStyle = fill
  context.fill()
}

function drawSurface(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options?: {
    fill?: CanvasFillStrokeStyles["fillStyle"]
    radius?: number
    stroke?: string
  },
) {
  const fill = options?.fill ?? APP_PANEL
  const stroke = options?.stroke ?? APP_LINE
  const radius = options?.radius ?? SURFACE_RADIUS

  drawRoundedRect(context, x, y, width, height, radius, fill)
  context.strokeStyle = stroke
  context.lineWidth = 1
  context.stroke()
}

function drawDivider(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
) {
  context.fillStyle = APP_LINE
  context.fillRect(x, y, width, 1)
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const normalizedText = text.trim().replace(/\s+/g, " ")

  if (!normalizedText) {
    return [""]
  }

  const words = normalizedText.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
      currentLine = word
      continue
    }

    let partial = ""

    for (const character of word) {
      const nextPartial = `${partial}${character}`

      if (context.measureText(nextPartial).width <= maxWidth) {
        partial = nextPartial
        continue
      }

      if (partial) {
        lines.push(partial)
      }

      partial = character
    }

    currentLine = partial
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines?: number,
) {
  const wrappedLines = wrapText(context, text, maxWidth)
  const lines =
    typeof maxLines === "number" && wrappedLines.length > maxLines
      ? [
          ...wrappedLines.slice(0, maxLines - 1),
          `${wrappedLines[maxLines - 1].replace(/\s+$/, "")}\u2026`,
        ]
      : wrappedLines

  lines.forEach((line, lineIndex) => {
    context.fillText(line, x, y + lineIndex * lineHeight)
  })

  return lines.length
}

function drawPill(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  options: {
    fill: string
    minWidth?: number
    stroke?: string
    textColor: string
  },
) {
  context.font = MICRO_FONT
  const width = Math.max(
    options.minWidth ?? 0,
    context.measureText(label).width + 30,
  )

  drawSurface(context, x, y, width, 38, {
    fill: options.fill,
    radius: 999,
    stroke: options.stroke ?? "transparent",
  })

  context.fillStyle = options.textColor
  context.textAlign = "center"
  context.fillText(label, x + width / 2, y + 24)
  context.textAlign = "left"

  return width
}

function getPillWidth(
  context: CanvasRenderingContext2D,
  label: string,
  minWidth?: number,
) {
  context.font = MICRO_FONT
  return Math.max(minWidth ?? 0, context.measureText(label).width + 30)
}

function getRightAlignedPillX(
  context: CanvasRenderingContext2D,
  label: string,
  textRightX: number,
  minWidth?: number,
) {
  context.font = MICRO_FONT
  const textWidth = context.measureText(label).width
  const pillWidth = getPillWidth(context, label, minWidth)
  return textRightX - textWidth / 2 - pillWidth / 2
}

function drawMetricRows(
  context: CanvasRenderingContext2D,
  rows: SummaryMetricRow[],
  options: {
    labelX: number
    rowHeight: number
    valueX: number
    width: number
    y: number
  },
) {
  rows.forEach((row, index) => {
    const rowY = options.y + index * options.rowHeight

    context.fillStyle = APP_MUTED
    context.font = LABEL_FONT
    context.textAlign = "left"
    context.fillText(row.label, options.labelX, rowY)

    context.fillStyle = APP_FOREGROUND
    context.font = VALUE_FONT
    context.textAlign = "right"
    context.fillText(row.value, options.valueX, rowY)
    context.textAlign = "left"

    if (index < rows.length - 1) {
      drawDivider(
        context,
        options.labelX,
        rowY + 20,
        options.width,
      )
    }
  })
}

function getItemRowHeight() {
  return 58
}

function getSummaryRows(data: ReceiptSummaryShareData): SummaryMetricRow[] {
  return [
    { label: "Items subtotal", value: data.subtotalLabel },
    { label: "Tax", value: data.taxLabel },
    { label: "Tip", value: data.tipLabel },
    { label: "Fees", value: data.feeLabel },
    { label: "Discount", value: data.discountLabel },
  ]
}

function getStatusPalette(isPaid: boolean): StatusPalette {
  return isPaid
    ? {
        accent: APP_ACCENT,
        fill: APP_ACCENT_SOFT,
        stroke: APP_ACCENT_STROKE,
        text: APP_ACCENT_FOREGROUND,
      }
    : {
        accent: APP_UNPAID,
        fill: APP_UNPAID_SOFT,
        stroke: APP_UNPAID_STROKE,
        text: APP_UNPAID_FOREGROUND,
      }
}

function getPaymentStatusHeadline(data: ReceiptSummaryShareData) {
  if (data.groups.length === 0) {
    return "No shares yet"
  }

  if (data.unpaidGroupCount === 0) {
    return "Everyone paid"
  }

  if (data.paidGroupCount === 0) {
    return "Nobody paid yet"
  }

  return `${data.unpaidGroupCount} unpaid`
}

function getHeaderHeight(
  context: CanvasRenderingContext2D,
  data: ReceiptSummaryShareData,
) {
  context.font = HEADER_FONT
  const merchantLines = wrapText(
    context,
    data.merchantName.trim() || "Receipt summary",
    SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING * 2 - 68,
  )

  return Math.max(286, 132 + Math.min(merchantLines.length, 3) * 70 + 94)
}

function getPaymentOverviewHeight(data: ReceiptSummaryShareData) {
  const rosterRows = Math.max(1, Math.ceil(data.groups.length / 2))
  return Math.max(332, 184 + rosterRows * 112 + Math.max(0, rosterRows - 1) * 16)
}

function getSummaryPanelHeight(data: ReceiptSummaryShareData) {
  const rowCount = getSummaryRows(data).length
  const metricsBottom = 186 + Math.max(0, rowCount - 1) * 48 + 20
  const noteHeight = 80
  const noteGap = 28
  const bottomPadding = 28

  return metricsBottom + noteGap + noteHeight + bottomPadding
}

function getGroupCardHeight(
  context: CanvasRenderingContext2D,
  group: ReceiptSummaryShareGroup,
  cardWidth: number,
) {
  context.font = GROUP_TITLE_FONT
  const titleLines = wrapText(context, group.groupName, cardWidth - 360)
  const headerHeight = Math.max(104, Math.min(titleLines.length, 2) * 42 + 34)
  const itemDetailsHeight =
    group.itemDetails.length > 0
      ? 34 + group.itemDetails.length * getItemRowHeight()
      : 82

  return 48 + headerHeight + 24 + 104 + 28 + itemDetailsHeight + 26
}

function getCanvasHeight(
  context: CanvasRenderingContext2D,
  data: ReceiptSummaryShareData,
) {
  const headerHeight = getHeaderHeight(context, data)
  const overviewHeight = getPaymentOverviewHeight(data)
  const groupCardWidth = SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING * 2
  const groupsHeight =
    94 +
    data.groups.reduce(
      (height, group, index) =>
        height +
        getGroupCardHeight(context, group, groupCardWidth) +
        (index === data.groups.length - 1 ? 0 : 18),
      0,
    )

  return Math.max(
    1200,
    56 + headerHeight + 24 + overviewHeight + 28 + groupsHeight + 88,
  )
}

function drawBackdrop(
  context: CanvasRenderingContext2D,
  canvasHeight: number,
) {
  context.fillStyle = APP_BACKGROUND
  context.fillRect(0, 0, SHARE_IMAGE_WIDTH, canvasHeight)
}

function drawHeaderSection(
  context: CanvasRenderingContext2D,
  data: ReceiptSummaryShareData,
  y: number,
) {
  const cardWidth = SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING * 2
  const headerHeight = getHeaderHeight(context, data)
  const cardX = CANVAS_SIDE_PADDING
  const contentWidth = cardWidth - 68

  drawSurface(context, cardX, y, cardWidth, headerHeight, {
    fill: APP_SURFACE,
    stroke: APP_LINE_STRONG,
  })

  context.fillStyle = APP_PRIMARY
  context.font = BRAND_FONT
  context.fillText("CHECK SPLIT", cardX + 34, y + 48)

  context.fillStyle = APP_FOREGROUND
  context.font = HEADER_FONT
  const merchantTop = y + 116
  drawWrappedText(
    context,
    data.merchantName.trim() || "Receipt summary",
    cardX + 34,
    merchantTop,
    contentWidth,
    70,
    3,
  )

  const detailCardY = y + headerHeight - 98
  const detailGap = 18
  const detailWidth = (cardWidth - 68 - detailGap) / 2
  const detailHeight = 70
  const detailDateX = cardX + 34
  const detailLocationX = detailDateX + detailWidth + detailGap

  drawSurface(context, detailDateX, detailCardY, detailWidth, detailHeight, {
    fill: APP_PANEL,
    radius: 24,
  })
  drawSurface(context, detailLocationX, detailCardY, detailWidth, detailHeight, {
    fill: APP_PANEL,
    radius: 24,
  })

  context.fillStyle = APP_MUTED
  context.font = SMALL_FONT
  context.fillText("Date & time", detailDateX + 18, detailCardY + 27)
  context.fillText("Location", detailLocationX + 18, detailCardY + 27)

  context.fillStyle = APP_FOREGROUND
  context.font = BODY_FONT
  drawWrappedText(
    context,
    formatShareDateTime(data.receiptOccurredAt),
    detailDateX + 18,
    detailCardY + 55,
    detailWidth - 36,
    22,
    1,
  )
  drawWrappedText(
    context,
    data.locationName.trim() || "No location added",
    detailLocationX + 18,
    detailCardY + 55,
    detailWidth - 36,
    22,
    1,
  )

  return y + headerHeight + 24
}

function drawSummaryPanel(
  context: CanvasRenderingContext2D,
  data: ReceiptSummaryShareData,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  drawSurface(context, x, y, width, height, {
    fill: APP_SURFACE,
    stroke: APP_LINE_STRONG,
  })

  context.fillStyle = APP_MUTED
  context.font = SECTION_LABEL_FONT
  context.fillText("Receipt summary", x + 28, y + 44)

  context.fillStyle = APP_FOREGROUND
  context.font = GROUP_VALUE_FONT
  context.fillText(data.totalLabel, x + 28, y + 98)

  context.fillStyle = APP_MUTED
  context.font = SMALL_FONT
  context.fillText("Current draft total", x + 28, y + 124)

  drawDivider(context, x + 28, y + 150, width - 56)

  drawMetricRows(context, getSummaryRows(data), {
    labelX: x + 28,
    rowHeight: 48,
    valueX: x + width - 28,
    width: width - 56,
    y: y + 186,
  })

  const noteX = x + 20
  const noteWidth = width - 40
  const metricsBottom =
    y + 186 + Math.max(0, getSummaryRows(data).length - 1) * 48 + 20
  const noteY = Math.max(y + height - 108, metricsBottom + 28)

  drawSurface(context, noteX, noteY, noteWidth, 80, {
    fill: APP_PANEL,
    radius: 22,
  })

  context.fillStyle = APP_MUTED
  context.font = SMALL_FONT
  drawWrappedText(
    context,
    "Adjustments distributed proportionally by item subtotal.",
    noteX + 16,
    noteY + 31,
    noteWidth - 32,
    22,
    2,
  )
}

function drawPaymentRosterTile(
  context: CanvasRenderingContext2D,
  group: ReceiptSummaryShareGroup,
  x: number,
  y: number,
  width: number,
) {
  const palette = getStatusPalette(group.isPaid)
  const pillLabel = group.isPaid ? "Paid" : "Unpaid"
  const pillWidth = getPillWidth(context, pillLabel, 92)
  const amountRightX = x + width - 18
  const pillX = getRightAlignedPillX(context, pillLabel, amountRightX, 92)

  drawSurface(context, x, y, width, 112, {
    fill: group.isPaid ? APP_SURFACE : "#fff9e8",
    radius: 24,
    stroke: palette.stroke,
  })

  drawRoundedRect(context, x + 16, y + 24, 8, 42, 4, palette.accent)

  drawPill(context, pillLabel, pillX, y + 16, {
    fill: palette.fill,
    stroke: palette.stroke,
    textColor: palette.text,
  })

  context.fillStyle = APP_FOREGROUND
  context.font = VALUE_FONT
  drawWrappedText(
    context,
    group.groupName,
    x + 38,
    y + 44,
    width - pillWidth - 96,
    26,
    2,
  )

  context.fillStyle = APP_MUTED
  context.font = SMALL_FONT
  context.fillText(
    group.isPaid ? "Marked settled" : "Still owes",
    x + 38,
    y + 82,
  )

  context.fillStyle = APP_FOREGROUND
  context.font = VALUE_FONT
  context.textAlign = "right"
  context.fillText(group.amountLabel, amountRightX, y + 84)
  context.textAlign = "left"
}

function drawPaymentPanel(
  context: CanvasRenderingContext2D,
  data: ReceiptSummaryShareData,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  drawSurface(context, x, y, width, height, {
    fill: APP_SURFACE,
    stroke: APP_LINE_STRONG,
  })

  context.fillStyle = APP_MUTED
  context.font = SECTION_LABEL_FONT
  context.fillText("Who paid", x + 28, y + 44)

  context.fillStyle = APP_FOREGROUND
  context.font = GROUP_VALUE_FONT
  context.fillText(getPaymentStatusHeadline(data), x + 28, y + 98)

  context.fillStyle = APP_MUTED
  context.font = SMALL_FONT
  context.fillText(
    `${data.paidGroupCount} paid  •  ${data.unpaidGroupCount} open`,
    x + 28,
    y + 126,
  )

  if (data.groups.length === 0) {
    drawSurface(context, x + 20, y + 154, width - 40, 110, {
      fill: APP_SURFACE,
      radius: 24,
    })
    context.fillStyle = APP_MUTED
    context.font = BODY_FONT
    context.fillText("Create groups to generate a share image.", x + 40, y + 216)
    return
  }

  const tileGap = 16
  const innerWidth = width - 56
  const tileWidth = (innerWidth - tileGap) / 2
  const baseY = y + 154

  data.groups.forEach((group, index) => {
    const row = Math.floor(index / 2)
    const isOddLastTile =
      data.groups.length % 2 === 1 && index === data.groups.length - 1
    const tileX =
      x + 28 + (isOddLastTile ? 0 : (index % 2) * (tileWidth + tileGap))
    const drawWidth = isOddLastTile ? innerWidth : tileWidth
    const tileY = baseY + row * (112 + tileGap)

    drawPaymentRosterTile(context, group, tileX, tileY, drawWidth)
  })
}

function drawOverviewSection(
  context: CanvasRenderingContext2D,
  data: ReceiptSummaryShareData,
  y: number,
) {
  const sectionHeight = Math.max(
    getPaymentOverviewHeight(data),
    getSummaryPanelHeight(data),
  )
  const leftWidth = 346
  const gap = 18
  const rightWidth =
    SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING * 2 - leftWidth - gap

  drawSummaryPanel(
    context,
    data,
    CANVAS_SIDE_PADDING,
    y,
    leftWidth,
    sectionHeight,
  )
  drawPaymentPanel(
    context,
    data,
    CANVAS_SIDE_PADDING + leftWidth + gap,
    y,
    rightWidth,
    sectionHeight,
  )

  return y + sectionHeight + 28
}

function drawGroupMetricStrip(
  context: CanvasRenderingContext2D,
  group: ReceiptSummaryShareGroup,
  x: number,
  y: number,
  width: number,
) {
  const palette = getStatusPalette(group.isPaid)
  const metrics = [
    { label: "Items", value: group.itemsLabel },
    { label: "Tax", value: group.taxLabel },
    { label: "Tip", value: group.tipLabel },
    { label: "Fees", value: group.feeLabel },
    { label: "Discount", value: group.discountLabel },
  ]

  drawSurface(context, x, y, width, 104, {
    fill: palette.fill,
    radius: 24,
    stroke: palette.stroke,
  })

  const columnWidth = width / metrics.length

  metrics.forEach((metric, index) => {
    const columnX = x + index * columnWidth

    if (index > 0) {
      context.fillStyle = APP_LINE
      context.fillRect(columnX, y + 18, 1, 68)
    }

    context.fillStyle = APP_MUTED
    context.font = MICRO_FONT
    context.fillText(metric.label, columnX + 18, y + 36)

    context.fillStyle = APP_FOREGROUND
    context.font = VALUE_FONT
    context.fillText(metric.value, columnX + 18, y + 72)
  })
}

function drawGroupCard(
  context: CanvasRenderingContext2D,
  group: ReceiptSummaryShareGroup,
  x: number,
  y: number,
  width: number,
) {
  const cardHeight = getGroupCardHeight(context, group, width)
  const palette = getStatusPalette(group.isPaid)
  const statusLabel = group.isPaid ? "Paid" : "Unpaid"
  const amountRightX = x + width - 24
  const pillX = getRightAlignedPillX(context, statusLabel, amountRightX, 110)

  drawSurface(context, x, y, width, cardHeight, {
    fill: APP_SURFACE,
  })

  drawRoundedRect(context, x + 20, y + 28, 10, 88, 5, palette.accent)

  context.fillStyle = APP_FOREGROUND
  context.font = GROUP_TITLE_FONT
  const nameLineCount = drawWrappedText(
    context,
    group.groupName,
    x + 48,
    y + 62,
    width - 360,
    40,
    2,
  )

  context.fillStyle = APP_MUTED
  context.font = SMALL_FONT
  context.fillText(
    group.isPaid ? "Marked paid in workspace" : "Still waiting on payment",
    x + 48,
    y + 62 + nameLineCount * 40 + 10,
  )

  drawPill(context, statusLabel, pillX, y + 28, {
    fill: palette.fill,
    stroke: palette.stroke,
    textColor: palette.text,
  })

  context.fillStyle = APP_MUTED
  context.font = SMALL_FONT
  context.textAlign = "right"
  context.fillText("Amount due", amountRightX, y + 88)
  context.fillStyle = APP_FOREGROUND
  context.font = GROUP_VALUE_FONT
  context.fillText(group.amountLabel, amountRightX, y + 128)
  context.textAlign = "left"

  const metricY = y + 146
  drawGroupMetricStrip(context, group, x + 24, metricY, width - 48)

  const itemsY = metricY + 134
  context.fillStyle = APP_MUTED
  context.font = MICRO_FONT
  context.fillText("Items in share", x + 24, itemsY)

  if (group.itemDetails.length === 0) {
    drawSurface(context, x + 24, itemsY + 18, width - 48, 64, {
      fill: APP_PANEL,
      radius: 22,
    })
    context.fillStyle = APP_MUTED
    context.font = ITEM_META_FONT
    context.fillText("No assigned items yet.", x + 42, itemsY + 58)
    return cardHeight
  }

  const rowStartY = itemsY + 36

  group.itemDetails.forEach((detail, index) => {
    const rowY = rowStartY + index * getItemRowHeight()
    const itemTextWidth = width - 280

    context.fillStyle = APP_FOREGROUND
    context.font = BODY_FONT
    drawWrappedText(
      context,
      detail.description,
      x + 24,
      rowY,
      itemTextWidth,
      24,
      1,
    )

    context.fillStyle = APP_MUTED
    context.font = ITEM_META_FONT
    context.fillText(
      `${detail.ratioLabel} share of ${detail.subtotalLabel}`,
      x + 24,
      rowY + 24,
    )

    context.fillStyle = APP_FOREGROUND
    context.font = VALUE_FONT
    context.textAlign = "right"
    context.fillText(detail.amountLabel, x + width - 24, rowY + 10)
    context.textAlign = "left"

    if (index < group.itemDetails.length - 1) {
      drawDivider(context, x + 24, rowY + 36, width - 48)
    }
  })

  return cardHeight
}

function drawGroupSection(
  context: CanvasRenderingContext2D,
  data: ReceiptSummaryShareData,
  y: number,
) {
  context.fillStyle = APP_MUTED
  context.font = SECTION_LABEL_FONT
  context.fillText("Per-person details", CANVAS_SIDE_PADDING, y + 22)

  context.textAlign = "right"
  context.font = SMALL_FONT
  context.fillText(
    `${data.groups.length} share${data.groups.length === 1 ? "" : "s"}`,
    SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING,
    y + 22,
  )
  context.textAlign = "left"

  let currentY = y + 48
  const cardWidth = SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING * 2

  for (const group of data.groups) {
    const cardHeight = drawGroupCard(
      context,
      group,
      CANVAS_SIDE_PADDING,
      currentY,
      cardWidth,
    )

    currentY += cardHeight + 18
  }

  return currentY
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to export summary image."))
          return
        }

        resolve(blob)
      },
      "image/jpeg",
      0.94,
    )
  })
}

export function buildReceiptSummaryShareFilename(
  merchantName: string,
  receiptOccurredAt: string,
) {
  const merchantSegment = sanitizeSegment(merchantName.trim()) || "receipt"
  const date = new Date(receiptOccurredAt)
  const dateSegment = Number.isNaN(date.getTime())
    ? "summary"
    : date.toISOString().slice(0, 10)

  return `${merchantSegment}-summary-${dateSegment}.jpeg`
}

export function buildReceiptSummaryShareData(input: {
  discountLabel: string
  feeLabel: string
  groups: Array<{
    amountLabel: string
    amountValue: number
    discountLabel: string
    feeLabel: string
    groupDisplayName: string
    isPaid: boolean
    itemDetails: ReceiptSummaryShareItemDetail[]
    itemsLabel: string
    taxLabel: string
    tipLabel: string
  }>
  locationName: string
  merchantName: string
  receiptOccurredAt: string
  subtotalLabel: string
  taxLabel: string
  tipLabel: string
  totalLabel: string
}) {
  const groups = [...input.groups]
    .sort((left, right) => {
      if (left.isPaid !== right.isPaid) {
        return left.isPaid ? 1 : -1
      }

      return right.amountValue - left.amountValue
    })
    .map((group) => ({
      amountLabel: group.amountLabel,
      amountValue: group.amountValue,
      discountLabel: group.discountLabel,
      feeLabel: group.feeLabel,
      groupName: group.groupDisplayName || "Untitled group",
      isPaid: group.isPaid,
      itemDetails: group.itemDetails,
      itemsLabel: group.itemsLabel,
      taxLabel: group.taxLabel,
      tipLabel: group.tipLabel,
    }))
  const paidGroupCount = groups.filter((group) => group.isPaid).length

  return {
    discountLabel: input.discountLabel,
    feeLabel: input.feeLabel,
    groups,
    locationName: input.locationName.trim(),
    merchantName: input.merchantName.trim() || "Receipt summary",
    paidGroupCount,
    receiptOccurredAt: input.receiptOccurredAt,
    subtotalLabel: input.subtotalLabel,
    taxLabel: input.taxLabel,
    tipLabel: input.tipLabel,
    totalLabel: input.totalLabel,
    unpaidGroupCount: Math.max(groups.length - paidGroupCount, 0),
  } satisfies ReceiptSummaryShareData
}

export async function renderReceiptSummaryJpegFile(
  data: ReceiptSummaryShareData,
) {
  await waitForFonts()

  const measurementCanvas = createCanvasElement(SHARE_IMAGE_WIDTH, 100)
  const measurementContext = measurementCanvas.getContext("2d")

  if (!measurementContext) {
    throw new Error("Unable to prepare summary image export.")
  }

  const canvasHeight = getCanvasHeight(measurementContext, data)
  const canvas = createCanvasElement(SHARE_IMAGE_WIDTH, canvasHeight)
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Unable to render summary image.")
  }

  drawBackdrop(context, canvasHeight)

  const headerBottom = drawHeaderSection(context, data, 56)
  const overviewBottom = drawOverviewSection(context, data, headerBottom)
  const contentBottom = drawGroupSection(context, data, overviewBottom)

  context.fillStyle = APP_MUTED
  context.font = SMALL_FONT
  context.fillText(
    "Generated from receipt summary. Paid markers reflect export time.",
    CANVAS_SIDE_PADDING,
    contentBottom + 28,
  )

  const blob = await canvasToJpegBlob(canvas)
  return new File(
    [blob],
    buildReceiptSummaryShareFilename(data.merchantName, data.receiptOccurredAt),
    { type: "image/jpeg" },
  )
}
