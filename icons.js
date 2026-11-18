const paths = {
  home: '<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/>',
  week: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h3m-3 3h6"/>',
  flag: '<path d="M5 21V4c5-3 9 3 15 0v10c-6 3-10-3-15 0"/>',
  disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.4"/><path d="M6 12a6 6 0 0 1 6-6m6 6a6 6 0 0 1-6 6"/>',
  journal:
    '<path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 0v18m3-13h6m-6 4h5"/>',
  settings:
    '<path d="M3 6h5m4 0h9M3 18h10m4 0h4M3 12h13m4 0h1"/><circle cx="10" cy="6" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="15" cy="18" r="2"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  out: '<path d="M6 18 18 6m-10 0h10v10"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  pulse: '<path d="M2 12h4l2-6 4 13 3-15 3 10h4"/>',
  wave: '<path d="M3 10v4m4-8v12m5-16v20m5-16v12m4-8v4"/>',
  task: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
  file: '<path d="M5 3h9l5 5v13H5zM14 3v6h5m-11 4h8m-8 4h6"/>',
  link: '<path d="m10 14 4-4m-6 2-2 2a3.7 3.7 0 0 0 5 5l3-3m-4-8 3-3a3.7 3.7 0 0 1 5 5l-2 2"/>',
  user: '<circle cx="12" cy="8" r="3.4"/><path d="M5 20v-1c0-7 14-7 14 0v1"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2c0-6 12-6 12 0v2m0-15c5 0 5 6 1 6m1 3c4-.1 5 2 5 5"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  layers: '<path d="m3 8 9-5 9 5-9 5-9-5Zm0 4 9 5 9-5M3 16l9 5 9-5"/>',
  save: '<path d="M4 3h12l4 4v14H4zM8 3v6h8V3M8 21v-7h8v7"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5m-14 6v4h18v-4"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M3 17v4h18v-4"/>',
  device:
    '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
  headphones:
    '<path d="M3 15v-3a9 9 0 0 1 18 0v3"/><rect x="3" y="12" width="4.5" height="8" rx="2"/><rect x="16.5" y="12" width="4.5" height="8" rx="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.3"/><path d="m16 16 5 5"/>',
  pen: '<path d="m4 16 12-12 4 4L8 20l-5 1zM14 6l4 4"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15m-8 4v7m4-7v7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',
  grid: '<path d="M4 4h16v16H4zM4 10h16M10 4v16"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',
  music:
    '<path d="M8 17V6l12-3v11M8 9l12-3"/><ellipse cx="5.5" cy="18" rx="2.5" ry="2"/><ellipse cx="17.5" cy="15" rx="2.5" ry="2"/>',
  filter: '<path d="M3 5h18l-7 8v5l-4 2v-7z"/>',
};
export const I = (name, size = 20) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
export const mark = `<svg class="brandmark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="9" fill="#13231f"/><g fill="#8fe3ce"><path d="m8 17 5-3v16l-5 3zm7-7 5-3v22l-5 3zm7 1 5-3v10l-5 3zm0 13 5-3v6l-5 3zm7-11 4-2v12l-4 3z"/></g></svg>`;
