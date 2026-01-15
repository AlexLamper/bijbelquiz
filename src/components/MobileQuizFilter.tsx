'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Filter } from 'lucide-react';

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
          <div className="space-y-1 pt-2 pb-4">
            <Button 
              variant={currentCategory === 'all' ? "secondary" : "ghost"} 
              className={`w-full justify-start ${currentCategory === 'all' ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
              asChild
              onClick={handleLinkClick}
            >
              <Link href="/quizzes" className='dark:text-black'>Alle Categorieën</Link>
            </Button>
            {categories.map((cat) => (
              <Button
                key={`mobile-${cat._id}`}
                variant={currentCategory === cat.slug ? "secondary" : "ghost"}
                className={`w-full justify-start ${currentCategory === cat.slug ? 'bg-primary/10 text-primary hover:bg-primary/20 dark:text-slate-700' : ''}`}
                asChild
                onClick={handleLinkClick}
              >
                <Link href={`/quizzes?category=${cat.slug}`}>
                  {cat.title}
                </Link>
              </Button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
