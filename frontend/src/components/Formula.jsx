import { useEffect, useRef } from 'react'
import katex from 'katex'

export default function Formula({ tex, block = false }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      katex.render(tex, ref.current, {
        throwOnError: false,
        displayMode: block,
      })
    }
  }, [tex, block])

  return <span ref={ref} />
}