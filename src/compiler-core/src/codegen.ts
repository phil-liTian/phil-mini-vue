export function generate (ast) {
  const context = createCodegenContext()
  const { push } = context

  push('return ')
  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  push(`function ${functionName}(${signature}) { `)

  push('return ')
  genCode(ast, context)
  push('}')

  return {
    code: context.code
    // code: `return function render(_ctx, _cache) { return "hi" }`
  }
}

const genCode = (ast, context) => {
  const node = ast.codegenNode
  context.push(`"${node.content}" `)
}

function createCodegenContext () {
  const context = {
    code: '',
    push: str => {
      context.code += str
    }
  }
  return context
}
