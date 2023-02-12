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
        tag: "div"
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


})