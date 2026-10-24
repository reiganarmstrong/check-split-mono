# Domain docs

This repository uses one domain context: root `GLOSSARY.md` and root `docs/adr/`.

## Before codebase exploration

Read `GLOSSARY.md` and ADRs relevant to the work. Use glossary terms in issue titles, specifications, hypotheses, and test names.

If domain docs are absent, proceed silently. Create glossary terms or ADRs through domain-modeling when definitions or decisions are resolved.

If a future root `GLOSSARY-MAP.md` exists, follow it to relevant context glossaries and also read context-specific ADRs.

## Decisions and vocabulary

Surface conflicts with an existing ADR explicitly instead of silently overriding it. Identify the affected decision and explain why it may need revisiting.

When a needed term is missing, determine whether it is an existing concept under another name or a domain-modeling gap before introducing new vocabulary.
