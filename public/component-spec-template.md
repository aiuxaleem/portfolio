# <component>.md — 8-section spec template (AIUXAleem)

## 01 Metadata
name: · tier: foundation | atom | molecule | organism | pattern · status: draft | stable | deprecated
owner: · version: · last reviewed:

## 02 Overview
What it is for. When to use it. When NOT to use it (and what to use instead).

## 03 Anatomy
Named parts and slots, in order. Example: [icon-left] label [icon-right]

## 04 Tokens
Every variable the component reads. Token names only — never a raw value.
| part | property | token |
| --- | --- | --- |
| root | background | --action-primary |
| label | color | --text-on-brand |
| root | radius | --radius-pill |

## 05 Props / API
| prop | type | default | required | design intent |
| --- | --- | --- | --- | --- |

## 06 States
rest · hover · focus-visible · active · disabled · loading · error
For each: tokens used, contrast ratio against its surface, reduced-motion behaviour.

## 07 Code examples
The three most common compositions, copy-pasteable.

## 08 Cross-refs
uses: · used by:
(Reciprocal: if A uses B, B lists A under "used by".)
