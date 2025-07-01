const { JSDOM } = require('jsdom');

// Provide stub for chrome.storage used in content.js
beforeAll(() => {
  global.chrome = {
    storage: {
      local: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(undefined)
      },
      sync: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(undefined)
      }
    }
  };
});

describe('updateNavigationPanel', () => {
  let window, document, updateNavigationPanel, createNavigationPanel;

  beforeEach(async () => {
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    ({ updateNavigationPanel, createNavigationPanel } = require('./content.js'));

    // create navigation panel element
    createNavigationPanel();
  });

  afterEach(() => {
    jest.resetModules();
    delete global.window;
    delete global.document;
  });

  test('populates buttons for detected messages', () => {
    // create dummy messages
    const msg1 = document.createElement('div');
    msg1.setAttribute('data-message-author-role', 'user');
    msg1.textContent = 'Hello world';

    const msg2 = document.createElement('div');
    msg2.setAttribute('data-message-author-role', 'assistant');
    msg2.textContent = 'Hello back';

    document.body.appendChild(msg1);
    document.body.appendChild(msg2);

    updateNavigationPanel();

    const buttons = document.querySelectorAll('#cgpt-nav-panel .cgpt-message-btn');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toContain('Hello world');
    expect(buttons[1].textContent).toContain('Hello back');
  });
});
