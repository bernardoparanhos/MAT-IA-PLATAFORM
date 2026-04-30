import katex from 'katex'

export default function Formula({ tex, block = false }) {
  if (!tex) return null

  // Se tiver $...$ no texto, renderiza misto (texto + LaTeX)
  if (tex.includes('$')) {
    const partes = tex.split(/(\$[^$]+\$)/)
    return (
        <span style={block ? { display: 'block' } : {}}>
        {partes.map((parte, i) => {
          if (parte.startsWith('$') && parte.endsWith('$')) {
            const formula = parte.slice(1, -1)
            return (
                <span
                    key={i}
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(formula, {
                        throwOnError: false,
                        displayMode: false,
                      })
                    }}
                />
            )
          }
          return <span key={i}>{parte}</span>
        })}
      </span>
    )
  }

  // Sem $, renderiza tudo como LaTeX puro (comportamento original)
  return (
      <span
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(tex, {
              throwOnError: false,
              displayMode: block,
            })
          }}
      />
  )
}