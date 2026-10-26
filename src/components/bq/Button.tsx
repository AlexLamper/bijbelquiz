import * as React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * The BijbelQuiz button: radius 12, bold Nunito, and the 3px darker bottom
 * edge every button in the designs has. Renders a `<button>` or, with `href`,
 * a Next `<Link>` with the same look.
 */
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none',
    'rounded-[12px] border font-extrabold no-underline',
    'transition-[background-color,color,border-color,transform] duration-150',
    'active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-lapis text-white border-transparent border-b-[3px] border-b-lapis-edge hover:bg-lapis-edge hover:text-white',
        secondary:
          'bg-card text-ink border-line border-b-[3px] hover:bg-chip hover:text-ink',
        gold:
          'bg-gold text-gold-ink border-transparent border-b-[3px] border-b-gold-edge hover:brightness-[0.97] hover:text-gold-ink',
        danger:
          'bg-coral-strong text-white border-transparent border-b-[3px] border-b-coral-edge hover:bg-coral-edge hover:text-white',
        'danger-secondary':
          'bg-card text-coral-text border-coral-line border-b-[3px] hover:bg-coral-tint hover:text-coral-text',
        /** White button on a lapis surface ("Speel nu" in the quiz of the day). */
        inverse:
          'bg-white text-lapis-edge border-transparent border-b-[3px] border-b-lapis-pale hover:bg-lapis-tint hover:text-lapis-edge',
        /** Near-black: "Doorgaan met Apple". */
        dark: 'bg-[#1B1A18] text-white border-transparent border-b-[3px] border-b-black hover:bg-black hover:text-white',
        /** Text only, no edge. Keeps the tap target. */
        ghost: 'bg-transparent text-lapis border-transparent hover:text-lapis-edge font-bold',
      },
      size: {
        sm: 'h-10 px-4 text-[15px]',
        md: 'h-11 px-[18px] text-[15px]',
        lg: 'h-12 px-7 text-base',
        xl: 'h-[52px] px-7 text-base',
        hero: 'h-14 px-8 text-[17px] rounded-[14px]',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

type NativeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: undefined;
};

type LinkButtonProps = Omit<React.ComponentProps<typeof Link>, 'href'> & {
  href: string;
  disabled?: boolean;
};

export type ButtonProps = (NativeButtonProps | LinkButtonProps) &
  ButtonVariants & {
    /** Shows a spinner and disables the button. */
    loading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button({ className, variant, size, block, loading, children, ...props }, ref) {
    const classes = cn(buttonVariants({ variant, size, block }), className);

    if (props.href !== undefined) {
      const { href, disabled, ...rest } = props as LinkButtonProps;
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          aria-disabled={disabled || undefined}
          className={cn(classes, disabled && 'pointer-events-none opacity-50')}
          {...rest}
        >
          {children}
        </Link>
      );
    }

    const { type = 'button', disabled, ...rest } = props as NativeButtonProps;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        disabled={disabled || loading}
        className={classes}
        {...rest}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);

/* ── Icon button ─────────────────────────────────────────────────────────── */

const iconButtonVariants = cva(
  [
    'inline-flex items-center justify-center shrink-0 border bg-card text-ink-soft no-underline',
    'hover:bg-chip hover:text-ink transition-colors disabled:opacity-50 disabled:pointer-events-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
  ],
  {
    variants: {
      shape: {
        round: 'rounded-full border-line',
        square: 'rounded-[12px] border-line',
        /** Square with the 3px edge, as next to "Bewerken" on the profile. */
        edge: 'rounded-[12px] border-line border-b-[3px]',
        /** No border: the eye in a password field. */
        plain: 'rounded-[10px] border-transparent bg-transparent text-ink-muted',
      },
      size: {
        sm: 'size-9',
        md: 'size-10',
        lg: 'size-11',
      },
    },
    defaultVariants: { shape: 'round', size: 'md' },
  },
);

type IconButtonProps = (NativeButtonProps | LinkButtonProps) &
  VariantProps<typeof iconButtonVariants> & {
    /** Required: icon buttons have no visible text. */
    'aria-label': string;
  };

export const IconButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, IconButtonProps>(
  function IconButton({ className, shape, size, children, ...props }, ref) {
    const classes = cn(iconButtonVariants({ shape, size }), className);
    if (props.href !== undefined) {
      const { href, disabled, ...rest } = props as LinkButtonProps;
      return (
        <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} aria-disabled={disabled || undefined} className={classes} {...rest}>
          {children}
        </Link>
      );
    }
    const { type = 'button', ...rest } = props as NativeButtonProps;
    return (
      <button ref={ref as React.Ref<HTMLButtonElement>} type={type} className={classes} {...rest}>
        {children}
      </button>
    );
  },
);
