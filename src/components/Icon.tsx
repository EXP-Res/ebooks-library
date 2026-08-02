import type { SVGProps } from 'react';

const paths: Record<string, string> = {
  search: 'M21 21l-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  settings: 'M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.7 1.7 0 00.34 1.88l.06.06-1.8 3.12-.09-.03a1.7 1.7 0 00-1.78.22 1.7 1.7 0 00-.72 1.76V22h-3.6v-.09a1.7 1.7 0 00-.72-1.76 1.7 1.7 0 00-1.78-.22l-.09.03-1.8-3.12.06-.06A1.7 1.7 0 007.8 15a1.7 1.7 0 00-1.4-1.25H6v-3.6h.1A1.7 1.7 0 007.5 9a1.7 1.7 0 00-.34-1.88l-.06-.06L8.9 3.94l.09.03a1.7 1.7 0 001.78-.22A1.7 1.7 0 0011.5 2h3.6v.09a1.7 1.7 0 00.72 1.76 1.7 1.7 0 001.78.22l.09-.03 1.8 3.12-.06.06A1.7 1.7 0 0019.1 9a1.7 1.7 0 001.4 1.25h.1v3.6h-.1A1.7 1.7 0 0019.4 15z',
  back: 'M19 12H5m6-6l-6 6 6 6',
  book: 'M4 5.5A2.5 2.5 0 016.5 3H11a3 3 0 013 3v15a3 3 0 00-3-3H4V5.5zm16 0A2.5 2.5 0 0017.5 3H14v18a3 3 0 013-3h3V5.5z',
  chevron: 'M9 18l6-6-6-6',
  sun: 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36l-1.42 1.42M7.06 16.94l-1.42 1.42m12.72 0l-1.42-1.42M7.06 7.06L5.64 5.64M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  fullscreen: 'M8 3H3v5m13-5h5v5m0 8v5h-5M8 21H3v-5',
  download: 'M12 3v12m-5-5l5 5 5-5M5 21h14',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  trash: 'M4 7h16m-10 4v6m4-6v6M9 7l1-3h4l1 3m3 0l-1 14H7L6 7',
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
