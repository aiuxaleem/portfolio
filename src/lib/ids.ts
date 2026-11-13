/* Ids that must be unique on a page while a component is drawn more than once (the logo's gradient). A module keeps its
   count across renders, where a component's own script starts again each time; numbers rise through a build in render
   order, so a build is the same every time. */
let count = 0;
export const nextId = (prefix: string) => `${prefix}-${++count}`;
