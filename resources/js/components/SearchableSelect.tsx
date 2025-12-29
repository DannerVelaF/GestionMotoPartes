import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    value?: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    onCreate?: () => void;
    error?: string;
    className?: string;
}

export function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = 'Seleccionar...',
    onCreate,
    error,
    className,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);

    const selectedLabel = options.find((opt) => opt.value === value)?.label;

    return (
        <div className="flex w-full flex-col gap-1">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            // Base styles
                            'w-full justify-between rounded-none border-0 border-b bg-transparent px-0 text-lg font-normal capitalize shadow-none focus:ring-0',
                            // Light mode colors
                            'border-input hover:bg-transparent hover:text-foreground',
                            // Dark mode specific adjustments
                            'dark:border-neutral-800 dark:text-neutral-100 dark:hover:text-white',
                            // Placeholder color
                            !value && 'text-muted-foreground',
                            // Error state
                            error && 'border-red-500 dark:border-red-500',
                            className,
                        )}
                    >
                        {selectedLabel || placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    className="p-0 dark:border-neutral-800 dark:bg-neutral-950"
                    style={{ width: 'var(--radix-popover-trigger-width)' }}
                    align="start"
                >
                    <Command className="dark:bg-neutral-950">
                        <CommandInput
                            placeholder="Buscar..."
                            className="dark:text-neutral-100"
                        />

                        <CommandList className="max-h-[200px] overflow-y-auto dark:text-neutral-200">
                            <CommandEmpty className="px-2 py-2 text-center text-sm">
                                <p className="mb-2 text-muted-foreground">
                                    No se encontraron resultados.
                                </p>
                            </CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => {
                                            onChange(
                                                option.value === value
                                                    ? ''
                                                    : option.value,
                                            );
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground dark:aria-selected:bg-neutral-800 dark:aria-selected:text-white"
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === option.value
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        <span className="capitalize">
                                            {option.label}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>

                        {onCreate && (
                            <div className="border-t p-1 dark:border-neutral-800">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full bg-blue-50/50 text-blue-600 hover:bg-blue-100/70 hover:text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/50 dark:hover:text-blue-300"
                                    onClick={() => {
                                        setOpen(false);
                                        onCreate();
                                    }}
                                >
                                    <Plus className="mr-2 h-3 w-3" />
                                    Crear nuevo
                                </Button>
                            </div>
                        )}
                    </Command>
                </PopoverContent>
            </Popover>
            {error && (
                <p className="text-sm font-medium text-red-500 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}
