'use client'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Loader2, Search, X } from 'lucide-react'
import React from 'react'
import useThreads from '@/hooks/use-threads'
import { atom, useAtom } from 'jotai'

export const isSearchingAtom = atom(false)
export const searchValueAtom = atom('')

const SearchBar = () => {
    const { isFetching } = useThreads()
    const [searchValue, setSearchValue] = useAtom(searchValueAtom)
    const [isSearching, setIsSearching] = useAtom(isSearchingAtom)
    const ref = React.useRef<HTMLInputElement>(null)

    const handleBlur = () => {
        // Don't close search mode if there's still a search value
        if (!!searchValue && searchValue.trim().length > 0) return
        setIsSearching(false)
    }

    const handleClear = () => {
        setSearchValue('')
        setIsSearching(false)
        ref.current?.blur()
    }

    const handleFocus = () => {
        setIsSearching(true)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchValue(value)
        
        // Set searching state based on whether there's content
        if (value.trim().length > 0) {
            setIsSearching(true)
        } else {
            // Only exit search mode if input is completely empty
            setIsSearching(false)
        }
    }

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Escape key to close search
            if (e.key === 'Escape') {
                handleClear()
                return
            }
            
            // "/" key to focus search (if not already in an input)
            if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName || '')) {
                e.preventDefault()
                ref.current?.focus()
                return
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Auto-focus when entering search mode
    React.useEffect(() => {
        if (isSearching && ref.current && document.activeElement !== ref.current) {
            ref.current.focus()
        }
    }, [isSearching])

    // Debug logging
    React.useEffect(() => {
        console.log('SearchBar state:', { searchValue, isSearching });
    }, [searchValue, isSearching]);

    return (
        <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <motion.div 
                className="relative" 
                layoutId="search-bar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
            >
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    ref={ref}
                    placeholder="Search emails... (Press '/' to focus)"
                    className="pl-8 pr-16"
                    value={searchValue}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    autoComplete="off"
                    spellCheck={false}
                />
                <div className="absolute right-2 top-2.5 flex items-center gap-1">
                    {isFetching && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {(searchValue || isSearching) && (
                        <button
                            type="button"
                            className="rounded-sm p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={handleClear}
                            title="Clear search"
                        >
                            <X className="size-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        </button>
                    )}
                </div>
                {searchValue && (
                    <div className="absolute left-2 -bottom-6 text-xs text-muted-foreground">
                        {searchValue.length < 2 ? 'Type at least 2 characters...' : `Searching for "${searchValue}"`}
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default SearchBar