import * as React from 'react';

/**
 * Renders a translated template that contains `{name}` placeholders for React
 * nodes (typically links): `rich('Read the {privacy}.', { privacy: <Link ...>privacy policy</Link> })`.
 * Keeps the link markup in code and the sentence order in the dictionary, so
 * every language can place the link where its grammar wants it.
 */
export function rich(template: string, parts: Record<string, React.ReactNode>): React.ReactNode {
  const pieces = template.split(/(\{\w+\})/g);
  return (
    <>
      {pieces.map((piece, index) => {
        const match = /^\{(\w+)\}$/.exec(piece);
        if (match && match[1] in parts) return <React.Fragment key={index}>{parts[match[1]]}</React.Fragment>;
        return piece === '' ? null : <React.Fragment key={index}>{piece}</React.Fragment>;
      })}
    </>
  );
}
