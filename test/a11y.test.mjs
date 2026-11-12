import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * What a screen reader needs, checked against the client source.
 *
 * The DOM cannot be rendered here without a browser, and the failures this guards are
 * structural: a live region that is not a live region, a list whose children are not list
 * items. Reading the source catches exactly those, the same way the locale test reads it.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'lib', 'client.js'), 'utf8')

test('the toast is a polite live region, and errors are alerts', () => {
  assert.match(source, /className: 'gt-toast', role: 'status', 'aria-live': 'polite'/)
  assert.match(source, /className: 'gt-banner', role: 'alert'/)
})

test('lists are lists, down to the items', () => {
  assert.match(source, /className: 'gt-groups', role: 'list'/)
  assert.match(source, /className: 'gt-group', key: group\.key, role: 'listitem'/)
  assert.match(source, /className: 'gt-list', role: 'list'/)
})

test('the filter row says which filter is on, and what the row is for', () => {
  assert.match(source, /'aria-pressed': filter === key/)
  assert.match(source, /className: 'gt-tabs', role: 'group', 'aria-label': t\('filter\.label'\)/)
})

test('a collapsible group header reports its state', () => {
  assert.match(source, /'aria-expanded': !isCollapsed/)
})

test('every icon-only button carries an accessible name', () => {
  const buttons = source.match(/className: 'gt-iconbtn'/g) ?? []
  const labels = source.match(/className: 'gt-iconbtn'[\s\S]{0,400}?'aria-label'/g) ?? []
  assert.ok(buttons.length > 0, 'the panel uses icon buttons')
  assert.equal(labels.length, buttons.length, 'an icon button without a label is announced as "button"')
})

test('the hand-off chooser is a modal dialog with a name and a way out', () => {
  // Reported 2026-11-12: aiming a single row's "交给 Agent" meant changing the toolbar's
  // panel-wide picker first. The chooser is the answer, so its shape is a contract: a
  // dialog (not a popover the list would clip), modal, named, and dismissable by Escape
  // and by the scrim — a modal with no way out strands a keyboard user on a card they
  // cannot see past.
  assert.match(source, /className: 'gt-settings gt-dispatch-ask',[\s\S]{0,200}?role: 'dialog'/)
  assert.match(source, /role: 'dialog',\s*'aria-modal': 'true',\s*'aria-label': t\('dispatch\.title'\)/)
  assert.match(source, /if \(dispatchAsk !== null\) \{\s*setDispatchAsk\(null\)/)
  assert.match(source, /event\.target\.className === 'gt-mask'/)
})

test('the chooser alternatives are buttons, and the picked one says so', () => {
  // `role: 'listitem'` inside a `role: 'list'` is the shape the list contract above uses;
  // pressing state is what tells a screen reader which conversation is armed.
  assert.match(source, /className: 'gt-dispatch-list', role: 'list'/)
  assert.match(source, /className: 'gt-dispatch-option',[\s\S]{0,200}?'aria-pressed': dispatchAsk\.target === option\.value/)
})
