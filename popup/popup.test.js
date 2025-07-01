const { JSDOM } = require('jsdom');
const { createTagChip } = require('./popup.js');

describe('createTagChip', () => {
  beforeAll(() => {
    global.chrome = {
      storage: {
        sync: {
          set: jest.fn().mockResolvedValue(undefined)
        }
      }
    };
  });

  test('removes tag from item when clicked', async () => {
    const dom = new JSDOM('<div id="c"></div>');
    global.document = dom.window.document;
    const container = dom.window.document.getElementById('c');
    const item = { tags: ['foo'] };
    const all = [item];
    const chip = createTagChip('foo', item, all);
    container.appendChild(chip);
    await chip.querySelector('button').onclick();
    expect(item.tags).toHaveLength(0);
    expect(container.children.length).toBe(0);
  });
});
