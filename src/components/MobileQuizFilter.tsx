'use client';

import * as React from 'react';
import { Filter } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CategoryShape {
  _id: string;
  title: string;
}

interface MobileQuizFilterProps {
  categories: CategoryShape[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  showPremiumOnly: boolean;
  onPremiumToggle: (value: boolean) => void;
}

export function MobileQuizFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  showPremiumOnly,
  onPremiumToggle,
}: MobileQuizFilterProps) {
  const [openItem, setOpenItem] = React.useState<string>('');

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    setOpenItem('');
  };

  const activeCategoryLabel =
    selectedCategory === 'all'
      ? 'Alle categorieen'
      : categories.find((category) => category._id === selectedCategory)?.title || 'Alle categorieen';

  return (
    <div className="md:hidden">
      <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem}>
        <AccordionItem value="filters" className="border border-rule bg-paper-raised px-3">
          <AccordionTrigger className="py-2.5 text-sm hover:no-underline">
            <span className="inline-flex items-center gap-2 font-medium text-ink">
              <Filter className="h-4 w-4" />
              {activeCategoryLabel}
            </span>
          </AccordionTrigger>

          <AccordionContent className="pb-3">
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCategorySelect('all')}
                className={cn(
                  'h-9 w-full justify-start rounded-md border-rule px-3 text-sm',
                  selectedCategory === 'all'
                    ? 'border-transparent bg-ink text-ink-inverted  hover:bg-ink-soft  dark:text-ink-inverted '
                    : 'bg-paper-raised text-ink-soft hover:bg-paper-sunken hover:text-ink     '
                )}
              >
                Alle categorieen
              </Button>

              {categories.map((category) => (
                <Button
                  key={category._id}
                  type="button"
                  variant="outline"
                  onClick={() => handleCategorySelect(category._id)}
                  className={cn(
                    'h-9 w-full justify-start rounded-md border-rule px-3 text-sm',
                    selectedCategory === category._id
                      ? 'border-transparent bg-ink text-ink-inverted  hover:bg-ink-soft  dark:text-ink-inverted '
                      : 'bg-paper-raised text-ink-soft hover:bg-paper-sunken hover:text-ink     '
                  )}
                >
                  {category.title}
                </Button>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => onPremiumToggle(!showPremiumOnly)}
                className={cn(
                  'mt-1 h-9 w-full justify-start rounded-md border-rule px-3 text-sm',
                  showPremiumOnly
                    ? 'border-transparent bg-ink text-ink-inverted  hover:bg-ink-soft  dark:text-ink-inverted '
                    : 'bg-paper-raised text-ink-soft hover:bg-paper-sunken hover:text-ink     '
                )}
              >
                Alleen Premium
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
