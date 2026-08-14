export default function (eleventyConfig) {
  // Stamps the stylesheet URL so a dev browser can't serve a cached copy of
  // ptot.css against freshly built markup — which looks exactly like a layout
  // bug and is very hard to tell apart from one.
  eleventyConfig.addGlobalData('buildId', String(Date.now()));

  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addWatchTarget('src/assets/css/');

  // Absolute URL for canonical tags, OG tags and JSON-LD.
  eleventyConfig.addFilter('absolute', function (path, base) {
    return new URL(path, base).href;
  });

  eleventyConfig.addFilter('dateISO', function (d) {
    return new Date(d).toISOString().slice(0, 10);
  });

  // "2026-08-14" -> "August 2026", for the dated availability line.
  eleventyConfig.addFilter('monthYear', function (iso) {
    const [y, m] = String(iso).split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[Number(m) - 1]} ${y}`;
  });

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data'
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk'
  };
}
