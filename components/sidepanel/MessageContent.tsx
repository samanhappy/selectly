import Markdown from 'markdown-to-jsx';
import React from 'react';

const CodeBlockContext = React.createContext(false);

const getNodeText = (node: React.ReactNode): string =>
  React.Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      return '';
    })
    .join('');

export const isCodeBlockContent = ({
  insidePre,
  className,
  children,
}: {
  insidePre: boolean;
  className?: string;
  children: React.ReactNode;
}) => Boolean(insidePre || className?.includes('lang-') || getNodeText(children).includes('\n'));

export const MessageContent = ({ content }: { content: string }) => (
  <Markdown
    className="sl-markdown min-w-0 max-w-full space-y-2 break-words"
    options={{
      wrapper: 'div',
      forceWrapper: true,
      overrides: {
        p: { component: ({ children }: any) => <p className="m-0 break-words">{children}</p> },
        a: {
          component: ({ children, ...props }: any) => (
            <a
              className="break-words text-blue-600 underline"
              target="_blank"
              rel="noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
        },
        pre: {
          component: ({ className, children, ...props }: any) => (
            <pre className={`sl-code-block ${className || ''}`.trim()} {...props}>
              <CodeBlockContext.Provider value={true}>{children}</CodeBlockContext.Provider>
            </pre>
          ),
        },
        code: {
          component: ({ className, children, ...props }: any) => {
            const insidePre = React.useContext(CodeBlockContext);
            const isBlock = isCodeBlockContent({ insidePre, className, children });

            return (
              <code
                className={`${isBlock ? 'sl-code-block-content' : 'sl-code-inline'} ${
                  className || ''
                }`.trim()}
                {...props}
              >
                {children}
              </code>
            );
          },
        },
      },
    }}
  >
    {content}
  </Markdown>
);
