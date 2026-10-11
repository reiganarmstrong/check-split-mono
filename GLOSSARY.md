# CheckSplit

CheckSplit turns receipt details into an editable bill that people can review and split.

## Language

**Receipt extraction**:
Reading a receipt image to identify its merchant, purchased items, quantities, prices, and charges for a receipt draft.
_Avoid_: OCR when referring to the whole extraction workflow.

**Receipt draft**:
An editable receipt awaiting review and saving, whether its details came from an image or manual entry.
_Avoid_: Final receipt for an unreviewed draft.

**Printed total**:
The total or amount due shown on the source receipt. It can disagree with the receipt's itemized amounts and charges.

**Draft total**:
The amount payable represented by the editable receipt draft. It can differ from the printed total while the user reviews or corrects the draft.

**Receipt extraction accuracy**:
How closely extracted receipt details match the facts on the source receipt.

**Receipt draft correctness**:
Whether the editable receipt represents the extracted items and charges correctly, including discrepancies that require review.

**Derived receipt total**:
The total calculated from interpreted receipt item amounts and charges. It can disagree with the printed total.

**Derived arithmetic accuracy**:
Whether interpreted receipt item amounts and calculated totals match the expected amounts, even when the printed total is inconsistent.
