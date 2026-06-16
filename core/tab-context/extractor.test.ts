import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { captureTabContextSnapshot, TAB_CONTEXT_BLOCK_SELECTOR } from './extractor';

const readabilityState = vi.hoisted(() => ({
  article: null as { textContent?: string; title?: string } | null,
}));

vi.mock('@mozilla/readability', () => ({
  Readability: class {
    parse() {
      return readabilityState.article;
    }
  },
}));

class FakeElement {
  tagName: string;
  textContent: string;
  hidden = false;
  previousElementSibling: FakeElement | null = null;

  constructor(tagName: string, textContent: string) {
    this.tagName = tagName.toUpperCase();
    this.textContent = textContent;
  }

  getAttribute() {
    return null;
  }

  closest() {
    return null;
  }

  matches() {
    return false;
  }
}

const createDocument = (elements: FakeElement[], title = 'Example Page') =>
  ({
    title,
    location: {
      href: 'https://example.com/page',
      hostname: 'example.com',
    },
    documentElement: {
      lang: 'en',
    },
    body: {
      querySelectorAll: () => elements,
    },
    querySelector: (selector: string) =>
      selector === 'html'
        ? {
            getAttribute: () => 'en',
          }
        : null,
    querySelectorAll: (selector: string) => (selector === 'iframe' ? [] : elements),
    cloneNode: () => ({}),
  }) as unknown as Document;

const budget = {
  maxContextChars: 10000,
};

describe('tab context extractor', () => {
  beforeEach(() => {
    readabilityState.article = null;
    vi.stubGlobal('HTMLElement', FakeElement);
    vi.stubGlobal('navigator', { language: 'en-US' });
    vi.stubGlobal('window', {
      getComputedStyle: () => ({
        display: 'block',
        visibility: 'visible',
        opacity: '1',
      }),
      getSelection: () => null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not select broad container elements as text blocks', () => {
    const selectors = TAB_CONTEXT_BLOCK_SELECTOR.split(',');

    expect(selectors).not.toContain('article');
    expect(selectors).not.toContain('main');
    expect(selectors).not.toContain('section');
  });

  it('keeps visible task-list DOM blocks when readability returns only one item', () => {
    readabilityState.article = {
      title: 'selectly side tab',
      textContent:
        '【中宏保险】 尊敬的客户，您的保险合同 P000026733 本期保费5000元尚未足额交纳，逾期保险合同将发生自动贷款或效力中止，请于2026年06月28日前交纳。请点击中宏保险或绑定我司官微查看详情，如需咨询，敬请联系您的保险合同服务人员或致电我司热线95383。',
    };

    const doc = createDocument(
      [
        new FakeElement(
          'li',
          'extract 不全：side panel 应该抽取当前页面中所有可见代办事项，而不是只保留最后一条。'
        ),
        new FakeElement('li', '删功能：清理旧入口并确认抽取结果仍然包含页面上的其他任务。'),
        new FakeElement(
          'li',
          '【中宏保险】 尊敬的客户，您的保险合同 P000026733 本期保费5000元尚未足额交纳，逾期保险合同将发生自动贷款或效力中止，请于2026年06月28日前交纳。请点击中宏保险或绑定我司官微查看详情，如需咨询，敬请联系您的保险合同服务人员或致电我司热线95383。'
        ),
      ],
      '今天 - 滴答清单'
    );

    const snapshot = captureTabContextSnapshot(doc, budget);

    expect(snapshot.source).toBe('readability');
    expect(snapshot.text).toContain('extract 不全');
    expect(snapshot.text).toContain('删功能');
    expect(snapshot.text).toContain('中宏保险');
    expect(snapshot.blocks.length).toBeGreaterThan(1);
  });

  it('keeps issue metadata and comments when readability captures only the issue body', () => {
    readabilityState.article = {
      title: 'Build software better, together',
      textContent:
        'Problem MCPHub launches stdio MCP servers by spawning package runners at runtime. These runners install the package on first use and rely on their own caches, which can become stale or corrupted.',
    };

    const doc = createDocument(
      [
        new FakeElement(
          'p',
          'Problem MCPHub launches stdio MCP servers by spawning package runners at runtime. These runners install the package on first use and rely on their own caches, which can become stale or corrupted.'
        ),
        new FakeElement(
          'p',
          '11113127 opened this issue 7 hours ago and last edited it after reproducing the cache failure.'
        ),
        new FakeElement(
          'p',
          'Maintainer comment: we should add a clear cache command and document which npm and uv cache paths are affected.'
        ),
      ],
      'Add a way to clear/refresh the npx/uvx cache'
    );

    const snapshot = captureTabContextSnapshot(doc, budget);

    expect(snapshot.source).toBe('readability');
    expect(snapshot.text).toContain('11113127 opened this issue');
    expect(snapshot.text).toContain('Maintainer comment');
    expect(snapshot.blocks.length).toBeGreaterThan(1);
  });
});
