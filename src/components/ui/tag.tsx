export const TagLink = ({ href, children, withIcon }) => {
    return(
        <a href={href} target="_blank" className={`transition transform relative translate-y-0.5 inline-flex items-center py-0.5 ${withIcon ? 'pl-1 pr-1.5' : 'px-1.5'} rounded-lg border border-border text-sm bg-gradient-to-b from-background hover:to-background to-secondary text-foreground font-medium shadow-none hover:shadow-sm transform active:scale-[97%] active:shadow-inner`}>
            {children}
        </a>
    )
}

export const Tag = ({ children, withIcon }) => {
    return(
        <span className={`transition transform relative translate-y-0.5 inline-flex items-center ${withIcon ? 'pl-1 pr-1.5' : 'px-1.5'} rounded-lg border border-border text-sm bg-gradient-to-b from-secondary to-muted text-foreground font-medium`}>
            {children}
        </span>
    )
}