import { useEffect } from 'react'

const BASE_TITLE = 'MAT-IA'

export function usePageTitle(pageTitle) {
    useEffect(() => {
        document.title = pageTitle ? `${pageTitle} — ${BASE_TITLE}` : BASE_TITLE
        return () => {
            document.title = BASE_TITLE
        }
    }, [pageTitle])
}