import { NodeTypes } from "../src/ast"
import { baseParse } from "../src/parse"


describe('parser', () => { 
  describe('Interpolation', () => { 
    test('simple interpolation', () => { 
      const ast = baseParse("{{message}}")
      const interpolation = ast.children[0]

      expect(interpolation).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'message'
        }
      })
    })
  })

  describe('element', () => { 
    test("simple div", () => {
      const ast = baseParse("<div></div>");
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "div",
        children: []
      });
    });
  })

  describe('text', () => { 
    test("simple text", () => {
      const ast = baseParse("some text");
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some text'
      });
    });
  })

  test('element with interpolation and text', () => { 
    const ast = baseParse("<span>hi,{{message}}</span>");
    const element = ast.children[0];

    expect(element).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "span",
      children: [
        {
          type: NodeTypes.TEXT,
          content: 'hi,'
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'message'
          }
        }
      ]
    });
  })


  test('Nested element', () => { 
    const ast = baseParse("<div><p>hi</p>{{message}}</div>");
    const element = ast.children[0];

    expect(element).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: "p",
          children: [
            {
              type: NodeTypes.TEXT,
              content: 'hi'
            }
          ]
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'message'
          }
        }
      ]
    });
  })


  test('should throw error when lack end tag', () => { 
    // baseParse('<div><span></div>')
    expect(() => { baseParse('<div><span></div>') }).toThrow('缺少结束标签span')
  })

})