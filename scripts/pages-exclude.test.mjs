import assert from 'node:assert/strict';
import test from 'node:test';
import { isExcluded, normalizeExcludeRules } from './pages-exclude.mjs';

test('目录规则排除自身及后代，文件规则只匹配文件', () => {
  const rules = normalizeExcludeRules(['轻小说\\Re0\\', './学术/数学之美.pdf']);
  assert.deepEqual(rules, ['轻小说/Re0', '学术/数学之美.pdf']);
  assert.equal(isExcluded('轻小说/Re0/第一卷.epub', rules), true);
  assert.equal(isExcluded('轻小说/Re01/第一卷.epub', rules), false);
  assert.equal(isExcluded('学术/数学之美.pdf', rules), true);
  assert.equal(isExcluded('学术/数学之美.epub', rules), false);
});

test('拒绝绝对路径和父目录跳转', () => {
  assert.throws(() => normalizeExcludeRules(['../秘密']), /不能包含/);
  assert.throws(() => normalizeExcludeRules(['C:/books']), /相对路径/);
  assert.throws(() => normalizeExcludeRules({ path: '小说' }), /字符串数组/);
});
