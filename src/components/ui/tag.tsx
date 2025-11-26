export const TagLink = ({ href, children, withIcon }) => {
    return(
        <a href={href} target="_blank" className={`transition transform relative translate-y-0.5 inline-flex items-center py-0.5 ${withIcon ? 'pl-1 pr-1.5' : 'px-1.5'} rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-gradient-to-b from-white dark:from-stone-900 hover:to-white dark:hover:to-stone-900 to-stone-100 dark:to-stone-800 text-stone-950 dark:text-white font-medium shadow-none hover:shadow-sm`}>
            {children}
        </a>
    )
}

export const Tag = ({ children, withIcon }) => {
    return(
        <span className={`transition transform relative translate-y-0.5 inline-flex items-center ${withIcon ? 'pl-1 pr-1.5' : 'px-1.5'} rounded-lg border border-stone-300 dark:border-stone-700 text-sm bg-gradient-to-b from-white to-stone-200 dark:from-stone-800 dark:to-stone-700 text-stone-950 dark:text-white font-medium`}>
            {children}
        </span>
    )
}