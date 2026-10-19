import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import { splitArabicRuns } from '../../lib/arabicText';

export const ARABIC_FONT = "'Amiri', 'Noto Naskh Arabic', 'Traditional Arabic', serif";

/** Wrap Arabic runs so they render right-to-left with tashkeel intact, inside left-to-right English. */
export function arabize(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (typeof child === 'string') {
      return splitArabicRuns(child).map((r, i) =>
        r.arabic ? (
          <bdi key={i} dir="rtl" lang="ar" style={{ fontFamily: ARABIC_FONT, fontSize: '1.3em', lineHeight: 1.9 }}>{r.text}</bdi>
        ) : (
          r.text
        ),
      );
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children !== undefined) {
      return cloneElement(child, undefined, arabize(child.props.children));
    }
    return child;
  });
}
