'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Filter, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryShape {
  _id: string; // serialized from server
  title: string;
  slug: string;
}

interface MobileQuizFilterProps {
  categories: CategoryShape[];
  currentCategory: string;
}

export default function MobileQuizFilter({ categories, currentCategory }: MobileQuizFilterProps) {
  const [isOpen, setIsOpen] = React.useState<string>("");

  const handleLinkClick = () => {
    // Collapse the accordion
    setIsOpen("");
  };

  const activeCategoryTitle = currentCategory === 'all' 
    ? 'Alle' 
    : categories.find((c) => c.slug === currentCategory)?.title || 'Alle';

  return (
    <Accordion type="single" collapsible value={isOpen} onValueChange={setIsOpen}>
      <AccordionItem value="categories" className="border-b-0">
        <AccordionTrigger className="hover:no-underline py-3">
          <span className="flex items-center gap-2 text-slate-800 font-medium">
            <Filter className="h-4 w-4" /> Filter ({activeCategoryTitle})
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-1 pt-2 pb-4">
            <Link 
              href="/quizzes"
              onClick={handleLinkClick}
              className={cn(
                "flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all",
                currentCategory === 'all'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>Alle Categorieën</span>
              {currentCategory === 'all' && <ChevronRight className="w-4 h-4" />}
            </Link>
            
            {categories.map((cat) => {
              const isActive = currentCategory === cat.slug;
              return (
                <Link 
                  key={`mobile-${cat._id}`}
                  href={`/quizzes?category=${cat.slug}`}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{cat.title}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
