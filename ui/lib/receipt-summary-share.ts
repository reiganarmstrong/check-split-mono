type ReceiptSummaryShareItemDetail = {
  amountLabel: string
  description: string
  ratioLabel: string
  subtotalLabel: string
}

type ReceiptSummaryShareGroup = {
  amountLabel: string
  discountLabel: string
  feeLabel: string
  groupName: string
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
  receiptOccurredAt: string
  subtotalLabel: string
  taxLabel: string
  tipLabel: string
  totalLabel: string
}

type SummaryMetricRow = {
  label: string
  value: string
}

const SHARE_IMAGE_WIDTH = 1200
const CANVAS_SIDE_PADDING = 72
const SURFACE_RADIUS = 36
const HEADER_FONT = "700 70px 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
const HEADING_FONT = "600 24px ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const LABEL_FONT = "500 24px ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const VALUE_FONT = "600 28px 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif"
const TOTAL_FONT = "700 38px 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
const BODY_FONT = "500 22px ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const SMALL_FONT = "500 18px ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const ITEM_META_FONT = "500 17px ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const GROUP_TITLE_FONT =
  "600 32px 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif"
const GROUP_VALUE_FONT =
  "700 30px 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
const APP_BACKGROUND = "#f5f6f0"
const APP_FOREGROUND = "#13181f"
const APP_MUTED = "rgba(19, 24, 31, 0.62)"
const APP_LINE = "rgba(19, 24, 31, 0.12)"
const APP_PANEL = "#fbfbf8"
const APP_SURFACE = "#ffffff"
const APP_TOPBAR = "#f8f8f3"
const APP_PRIMARY = "#2337d7"
const APP_PRIMARY_SOFT = "rgba(35, 55, 215, 0.1)"
const APP_SECONDARY_SOFT = "rgba(191, 208, 255, 0.22)"

function drawSurface(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options?: {
    fill?: string
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

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatShareDate(value: string) {
  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return "Receipt summary"
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate)
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
  fill: string,
) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
  context.fillStyle = fill
  context.fill()
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
      context.fillStyle = APP_LINE
      context.fillRect(
        options.labelX,
        rowY + 18,
        options.width,
        1,
      )
    }
  })
}

function getItemRowHeight() {
  return 60
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

function getGroupCardHeight(
  context: CanvasRenderingContext2D,
  group: ReceiptSummaryShareGroup,
  cardWidth: number,
) {
  context.font = GROUP_TITLE_FONT
  const titleLines = wrapText(context, group.groupName, cardWidth - 320)
  const titleBlockHeight = Math.max(titleLines.length, 1) * 38
  const headerBlockHeight = Math.max(titleBlockHeight, 82)
  const itemDetailsHeight =
    group.itemDetails.length > 0
      ? 28 + group.itemDetails.length * getItemRowHeight()
      : 52
  const totalsHeight = 28 + 5 * 38

  return 72 + headerBlockHeight + 28 + itemDetailsHeight + 20 + totalsHeight + 28
}

function getCanvasHeight(
  context: CanvasRenderingContext2D,
  data: ReceiptSummaryShareData,
) {
  context.font = HEADER_FONT
  const merchantLines = wrapText(
    context,
    data.merchantName.trim() || "Receipt summary",
    SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING * 2 - 280,
  )

  const headerHeight = 260 + Math.max(0, merchantLines.length - 1) * 74
  const summaryHeight = 462
  const groupCardWidth = SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING * 2
  const groupsHeight =
    88 +
    data.groups.reduce(
      (height, group, index) =>
        height +
        getGroupCardHeight(context, group, groupCardWidth) +
        (index === data.groups.length - 1 ? 0 : 20),
      0,
    )

  return Math.max(1080, headerHeight + summaryHeight + groupsHeight + 124)
}

function drawSummarySection(
  context: CanvasRenderingContext2D,
  data: ReceiptSummaryShareData,
  y: number,
) {
  const surfaceWidth = SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING * 2
  const rows = getSummaryRows(data)
  const sectionHeight = 462
  const cardX = CANVAS_SIDE_PADDING
  const cardRight = SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING
  const contentWidth = surfaceWidth - 72

  drawSurface(context, cardX, y, surfaceWidth, sectionHeight, {
    fill: APP_PANEL,
  })

  context.fillStyle = APP_MUTED
  context.font = HEADING_FONT
  context.fillText("Receipt summary", cardX + 36, y + 58)

  const totalPillWidth = 236
  drawSurface(
    context,
    cardRight - totalPillWidth - 36,
    y + 30,
    totalPillWidth,
    102,
    {
      fill: APP_SURFACE,
      radius: 28,
    },
  )

  context.fillStyle = APP_MUTED
  context.font = SMALL_FONT
  context.fillText(
    "Total due",
    cardRight - totalPillWidth,
    y + 72,
  )
  context.fillStyle = APP_FOREGROUND
  context.font = TOTAL_FONT
  context.fillText(
    data.totalLabel,
    cardRight - totalPillWidth,
    y + 112,
  )

  context.fillStyle = APP_LINE
  context.fillRect(
    cardX + 36,
    y + 162,
    contentWidth,
    1,
  )

  drawMetricRows(context, rows, {
    labelX: cardX + 36,
    rowHeight: 46,
    valueX: cardRight - 36,
    width: contentWidth,
    y: y + 202,
  })

  context.fillStyle = APP_LINE
  context.fillRect(
    cardX + 36,
    y + 398,
    contentWidth,
    1,
  )

  context.fillStyle = APP_MUTED
  context.font = LABEL_FONT
  context.fillText(
    "Current draft totals. Adjustments distributed by item subtotal.",
    cardX + 36,
    y + 430,
  )

  return y + sectionHeight + 40
}

function drawGroupSection(
  context: CanvasRenderingContext2D,
  data: ReceiptSummaryShareData,
  y: number,
) {
  context.fillStyle = APP_MUTED
  context.font = HEADING_FONT
  context.fillText("Group share preview", CANVAS_SIDE_PADDING, y + 28)

  let currentY = y + 64
  const cardWidth = SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING * 2

  for (const group of data.groups) {
    const cardHeight = getGroupCardHeight(context, group, cardWidth)
    const cardX = CANVAS_SIDE_PADDING
    const cardRight = SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING

    drawSurface(context, cardX, currentY, cardWidth, cardHeight, {
      fill: APP_SURFACE,
    })

    context.fillStyle = APP_FOREGROUND
    context.font = GROUP_TITLE_FONT
    const groupTitleLineCount = drawWrappedText(
      context,
      group.groupName,
      cardX + 32,
      currentY + 56,
      cardWidth - 320,
      38,
      2,
    )
    const titleBlockHeight = Math.max(groupTitleLineCount, 1) * 38
    const headerBlockHeight = Math.max(titleBlockHeight, 82)

    const sharePillWidth = 210
    drawSurface(
      context,
      cardRight - sharePillWidth - 32,
      currentY + 28,
      sharePillWidth,
      82,
      {
        fill: APP_TOPBAR,
        radius: 26,
      },
    )

    context.fillStyle = APP_MUTED
    context.font = SMALL_FONT
    context.fillText(
      "Group total",
      cardRight - sharePillWidth,
      currentY + 61,
    )
    context.fillStyle = APP_FOREGROUND
    context.font = GROUP_VALUE_FONT
    context.fillText(
      group.amountLabel,
      cardRight - sharePillWidth,
      currentY + 95,
    )

    const itemSectionY = currentY + 86 + headerBlockHeight
    context.fillStyle = APP_LINE
    context.fillRect(
      cardX + 32,
      currentY + 52 + headerBlockHeight,
      cardWidth - 64,
      1,
    )

    context.fillStyle = APP_MUTED
    context.font = SMALL_FONT
    context.fillText("Items to pay", cardX + 32, itemSectionY + 18)

    let nextSectionY = itemSectionY + 42

    if (group.itemDetails.length === 0) {
      context.fillStyle = APP_MUTED
      context.font = ITEM_META_FONT
      context.fillText("No assigned items yet", cardX + 32, nextSectionY + 4)
      nextSectionY += 34
    } else {
      group.itemDetails.forEach((detail, index) => {
        const rowY = nextSectionY + index * getItemRowHeight()
        const itemTextWidth = cardWidth - 300

        context.fillStyle = APP_FOREGROUND
        context.font = BODY_FONT
        drawWrappedText(
          context,
          detail.description,
          cardX + 32,
          rowY,
          itemTextWidth,
          24,
          1,
        )

        context.textAlign = "right"
        context.fillText(detail.amountLabel, cardRight - 32, rowY)
        context.textAlign = "left"

        context.fillStyle = APP_MUTED
        context.font = ITEM_META_FONT
        context.fillText(
          `${detail.ratioLabel} share of ${detail.subtotalLabel}`,
          cardX + 32,
          rowY + 24,
        )

        if (index < group.itemDetails.length - 1) {
          context.fillStyle = APP_LINE
          context.fillRect(
            cardX + 32,
            rowY + 38,
            cardWidth - 64,
            1,
          )
        }
      })

      nextSectionY += group.itemDetails.length * getItemRowHeight()
    }

    context.fillStyle = APP_LINE
    context.fillRect(
      cardX + 32,
      nextSectionY,
      cardWidth - 64,
      1,
    )

    context.fillStyle = APP_MUTED
    context.font = SMALL_FONT
    context.fillText("Totals", cardX + 32, nextSectionY + 22)

    const metricsTop = nextSectionY + 48
    drawMetricRows(context, [
      { label: "Items", value: group.itemsLabel },
      { label: "Tax", value: group.taxLabel },
      { label: "Tip", value: group.tipLabel },
      { label: "Fees", value: group.feeLabel },
      { label: "Discount", value: group.discountLabel },
    ], {
      labelX: cardX + 32,
      rowHeight: 44,
      valueX: cardRight - 32,
      width: cardWidth - 64,
      y: metricsTop,
    })

    currentY += cardHeight + 20
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
    discountLabel: string
    feeLabel: string
    groupDisplayName: string
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
  return {
    discountLabel: input.discountLabel,
    feeLabel: input.feeLabel,
    groups: input.groups.map((group) => ({
      amountLabel: group.amountLabel,
      discountLabel: group.discountLabel,
      feeLabel: group.feeLabel,
      groupName: group.groupDisplayName || "Untitled group",
      itemDetails: group.itemDetails,
      itemsLabel: group.itemsLabel,
      taxLabel: group.taxLabel,
      tipLabel: group.tipLabel,
    })),
    locationName: input.locationName.trim(),
    merchantName: input.merchantName.trim() || "Receipt summary",
    receiptOccurredAt: input.receiptOccurredAt,
    subtotalLabel: input.subtotalLabel,
    taxLabel: input.taxLabel,
    tipLabel: input.tipLabel,
    totalLabel: input.totalLabel,
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

  context.fillStyle = APP_BACKGROUND
  context.fillRect(0, 0, SHARE_IMAGE_WIDTH, canvasHeight)

  const gradient = context.createLinearGradient(0, 0, SHARE_IMAGE_WIDTH, canvasHeight)
  gradient.addColorStop(0, APP_PRIMARY_SOFT)
  gradient.addColorStop(1, "rgba(35, 55, 215, 0)")
  context.fillStyle = gradient
  context.fillRect(0, 0, SHARE_IMAGE_WIDTH, canvasHeight)

  const spotlight = context.createRadialGradient(180, 140, 0, 180, 140, 420)
  spotlight.addColorStop(0, APP_PRIMARY_SOFT)
  spotlight.addColorStop(1, "rgba(35, 55, 215, 0)")
  context.fillStyle = spotlight
  context.fillRect(0, 0, SHARE_IMAGE_WIDTH, canvasHeight)

  const accentSpotlight = context.createRadialGradient(
    SHARE_IMAGE_WIDTH - 160,
    canvasHeight - 120,
    0,
    SHARE_IMAGE_WIDTH - 160,
    canvasHeight - 120,
    320,
  )
  accentSpotlight.addColorStop(0, APP_SECONDARY_SOFT)
  accentSpotlight.addColorStop(1, "rgba(191, 208, 255, 0)")
  context.fillStyle = accentSpotlight
  context.fillRect(0, 0, SHARE_IMAGE_WIDTH, canvasHeight)

  const topCardY = 42
  const topCardHeight = 204

  drawSurface(
    context,
    CANVAS_SIDE_PADDING,
    topCardY,
    SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING * 2,
    topCardHeight,
    {
      fill: APP_TOPBAR,
    },
  )

  context.fillStyle = APP_PRIMARY
  context.font = HEADING_FONT
  context.fillText("CHECK SPLIT", CANVAS_SIDE_PADDING + 32, 84)

  context.fillStyle = APP_FOREGROUND
  context.font = HEADER_FONT
  const merchantLineCount = drawWrappedText(
    context,
    data.merchantName.trim() || "Receipt summary",
    CANVAS_SIDE_PADDING + 32,
    146,
    SHARE_IMAGE_WIDTH - CANVAS_SIDE_PADDING * 2 - 64,
    66,
    3,
  )

  const subtitleParts = [formatShareDate(data.receiptOccurredAt)]

  if (data.locationName.trim()) {
    subtitleParts.push(data.locationName.trim())
  }

  context.fillStyle = APP_MUTED
  context.font = BODY_FONT
  context.fillText(
    subtitleParts.join("  •  "),
    CANVAS_SIDE_PADDING + 32,
    146 + merchantLineCount * 66,
  )

  const summaryTop = topCardY + topCardHeight + 24
  const groupTop = drawSummarySection(context, data, summaryTop)
  const contentBottom = drawGroupSection(context, data, groupTop)

  context.fillStyle = APP_MUTED
  context.font = SMALL_FONT
  context.fillText(
    "Generated from receipt summary. Share from device menu.",
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
