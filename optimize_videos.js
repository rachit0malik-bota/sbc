const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

let count = 0;
// 1. Hero video
html = html.replace(
  '<video id="heroVideo" class="hero-bg-video" autoplay muted loop playsinline preload="auto">',
  '<video id="heroVideo" class="hero-bg-video" autoplay muted loop playsinline preload="metadata" poster="hero-coffee.jpg">'
);

// 2. Story videos
html = html.replace(
  /<video class="story-theater-media" autoplay muted loop playsinline preload="metadata">/g,
  () => { count++; return '<video class="story-theater-media" muted loop playsinline preload="none">'; }
);

// 3. Notebook videos
html = html.replace(
  /<video autoplay muted loop playsinline preload="metadata" class="notebook-thumb-video">/g,
  () => { count++; return '<video muted loop playsinline preload="none" class="notebook-thumb-video">'; }
);

// 4. Delivery video
html = html.replace(
  /<video class="delivery-video" autoplay muted loop playsinline preload="metadata">/g,
  () => { count++; return '<video class="delivery-video" muted loop playsinline preload="none">'; }
);

// 5. Reel videos
html = html.replace(
  /<video class="reel-video" autoplay muted loop playsinline preload="metadata">/g,
  () => { count++; return '<video class="reel-video" muted loop playsinline preload="none">'; }
);

// 6. Blackboard videos
html = html.replace(
  /<video class="blackboard-reel-video" autoplay muted loop playsinline preload="metadata">/g,
  () => { count++; return '<video class="blackboard-reel-video" muted loop playsinline preload="none">'; }
);

// 7. Make blackboard gallery images visible posters
html = html.replace(
  /<img (src="[^"]+" alt="[^"]+" class="gallery-card-img") style="display: none;">/g,
  '<img $1 loading="lazy">'
);

// 8. Modals
html = html.replace(
  '<video id="lightboxVideo" class="lightbox-video" controls autoplay loop playsinline style="display: none;">',
  '<video id="lightboxVideo" class="lightbox-video" controls loop playsinline style="display: none;" preload="none">'
);

html = html.replace(
  '<video id="cinemaVideo" class="cinema-video" controls playsinline preload="auto">',
  '<video id="cinemaVideo" class="cinema-video" controls playsinline preload="none">'
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Optimized video tags count: ' + count);
