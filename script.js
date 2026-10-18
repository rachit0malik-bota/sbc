/**
 * SBC (SECTION-B COFFEE) — MASTER CLIENT SCRIPT
 * GSAP 3 + ScrollTrigger + Lenis Smooth Momentum Scroll
 * High-performance, accessible, and motion-respecting interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------------------
  // 1. Accessibility: Check for prefers-reduced-motion
  // -------------------------------------------------------------------------
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------------------------------------------------------------------------
  // 2. Initialize Lenis Smooth Momentum Scroll
  // -------------------------------------------------------------------------
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
      });

      // Connect Lenis to GSAP ScrollTrigger via GSAP Ticker (avoids double-rAF stutter)
      if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(500, 33);
      } else {
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }
    } catch (e) {
      console.warn('Lenis initialization skipped:', e);
    }
  }

  // Smooth anchor scrolling
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(targetEl, { offset: -60 });
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // 3. Register GSAP Plugins
  // -------------------------------------------------------------------------
  const hasGsap = typeof gsap !== 'undefined';
  const hasScrollTrigger = typeof ScrollTrigger !== 'undefined';

  if (hasGsap && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // -------------------------------------------------------------------------
  // 4. Sticky Navigation Bar Scroll Trigger
  // -------------------------------------------------------------------------
  const siteHeader = document.getElementById('siteHeader');
  if (siteHeader) {
    const handleScrollNav = () => {
      if (window.scrollY > 40) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScrollNav, { passive: true });
    handleScrollNav();
  }

  // -------------------------------------------------------------------------
  // 4B. Minimalist Navigation Order Popover Toggle & Outside Click
  // -------------------------------------------------------------------------
  const navOrderDropdown = document.getElementById('navOrderDropdown');
  const navOrderBtn = document.getElementById('navOrderBtn');
  const navOrderPopover = document.getElementById('navOrderPopover');

  function closeNavOrderPopover() {
    if (navOrderDropdown) navOrderDropdown.classList.remove('is-open');
    if (navOrderBtn) navOrderBtn.setAttribute('aria-expanded', 'false');
    if (navOrderPopover) navOrderPopover.setAttribute('aria-hidden', 'true');
  }

  function toggleNavOrderPopover(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!navOrderDropdown || !navOrderBtn) return;
    const isOpen = navOrderDropdown.classList.contains('is-open');
    if (isOpen) {
      closeNavOrderPopover();
    } else {
      navOrderDropdown.classList.add('is-open');
      navOrderBtn.setAttribute('aria-expanded', 'true');
      if (navOrderPopover) navOrderPopover.setAttribute('aria-hidden', 'false');
    }
  }

  if (navOrderBtn) {
    navOrderBtn.addEventListener('click', toggleNavOrderPopover);
  }

  // Close popover when clicking anywhere outside
  document.addEventListener('click', (e) => {
    if (navOrderDropdown && !navOrderDropdown.contains(e.target)) {
      closeNavOrderPopover();
    }
  });

  // Close popover on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNavOrderPopover();
    }
  });

  // -------------------------------------------------------------------------
  // 5. Mobile Navigation Drawer
  // -------------------------------------------------------------------------
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMobileDrawer = document.getElementById('closeMobileDrawer');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileDrawerBackdrop = document.getElementById('mobileDrawerBackdrop');

  function openDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('is-active');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    if (mobileDrawerBackdrop) mobileDrawerBackdrop.classList.add('is-active');
    if (mobileMenuBtn) {
      mobileMenuBtn.classList.add('is-active');
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }

  function closeDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('is-active');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    if (mobileDrawerBackdrop) mobileDrawerBackdrop.classList.remove('is-active');
    if (mobileMenuBtn) {
      mobileMenuBtn.classList.remove('is-active');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = mobileDrawer && mobileDrawer.classList.contains('is-active');
      if (isActive) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (closeMobileDrawer) {
    closeMobileDrawer.addEventListener('click', closeDrawer);
  }

  if (mobileDrawerBackdrop) {
    mobileDrawerBackdrop.addEventListener('click', closeDrawer);
  }

  document.querySelectorAll('.drawer-link, .drawer-delivery a').forEach((link) => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });

  // -------------------------------------------------------------------------
  // 6. Hero Video Sound Mute/Unmute Toggle
  // -------------------------------------------------------------------------
  const heroVideo = document.getElementById('heroVideo');
  const heroSoundToggle = document.getElementById('heroSoundToggle');
  const heroSoundIcon = document.getElementById('heroSoundIcon');
  const heroSoundText = document.getElementById('heroSoundText');

  if (heroVideo) {
    heroVideo.muted = true;
    const playHero = () => {
      const p = heroVideo.play();
      if (p !== undefined) p.catch(() => {});
    };
    playHero();
    window.addEventListener('load', playHero);
    document.addEventListener('touchstart', playHero, { once: true });
    document.addEventListener('click', playHero, { once: true });
  }

  if (heroVideo && heroSoundToggle) {
    heroSoundToggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (heroVideo.muted) {
        heroVideo.muted = false;
        heroVideo.volume = 0.8;
        if (heroSoundIcon) heroSoundIcon.textContent = '🔊';
        if (heroSoundText) heroSoundText.textContent = 'Sound On';
        heroSoundToggle.style.background = 'rgba(200, 125, 50, 0.95)';
      } else {
        heroVideo.muted = true;
        if (heroSoundIcon) heroSoundIcon.textContent = '🔇';
        if (heroSoundText) heroSoundText.textContent = 'Muted';
        heroSoundToggle.style.background = 'rgba(10, 77, 52, 0.88)';
      }
    });
  }

  // -------------------------------------------------------------------------
  // 7. Cinema Fullscreen Video Modal
  // -------------------------------------------------------------------------
  const openCinemaModalBtn = document.getElementById('openCinemaModal');
  const closeCinemaModalBtn = document.getElementById('closeCinemaModal');
  const cinemaModal = document.getElementById('cinemaModal');
  const cinemaBackdrop = document.getElementById('cinemaBackdrop');
  const cinemaVideo = document.getElementById('cinemaVideo');

  function openCinema() {
    if (!cinemaModal) return;
    cinemaModal.classList.add('is-active');
    cinemaModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    if (cinemaVideo) {
      cinemaVideo.currentTime = 0;
      cinemaVideo.play().catch(() => {});
    }
  }

  function closeCinema() {
    if (!cinemaModal) return;
    cinemaModal.classList.remove('is-active');
    cinemaModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (cinemaVideo) {
      cinemaVideo.pause();
    }
  }

  if (openCinemaModalBtn) {
    openCinemaModalBtn.addEventListener('click', openCinema);
  }

  if (closeCinemaModalBtn) {
    closeCinemaModalBtn.addEventListener('click', closeCinema);
  }

  if (cinemaBackdrop) {
    cinemaBackdrop.addEventListener('click', closeCinema);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (cinemaModal && cinemaModal.classList.contains('is-active')) {
        closeCinema();
      }
      if (mobileDrawer && mobileDrawer.classList.contains('is-active')) {
        closeDrawer();
      }
    }
  });

  // -------------------------------------------------------------------------
  // 7B. High-Performance Offscreen Video Management (IntersectionObserver)
  // Ensures 60fps buttery scrolling without saturating hardware video decoders
  // -------------------------------------------------------------------------
  let videoScrollObserver = null;
  if ('IntersectionObserver' in window) {
    videoScrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (!video || video.tagName !== 'VIDEO') return;
        if (entry.isIntersecting) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
        }
      });
    }, {
      rootMargin: '120px 0px',
      threshold: 0.15
    });

    document.querySelectorAll(
      '.story-theater-media, .notebook-thumb-video, .delivery-video, .reel-card--tall .reel-video'
    ).forEach((v) => {
      if (v.tagName === 'VIDEO') {
        videoScrollObserver.observe(v);
      }
    });
  }

  // Secondary Reel cards: hover & tap play for instant response without video decoder bottlenecks
  function attachReelCardHover() {
    document.querySelectorAll('.reel-card:not(.reel-card--tall)').forEach((card) => {
      const video = card.querySelector('.reel-video');
      if (!video) return;

      card.addEventListener('mouseenter', () => {
        const p = video.play();
        if (p !== undefined) p.catch(() => {});
      });

      card.addEventListener('mouseleave', () => {
        if (!video.paused && video.muted) {
          video.pause();
        }
      });
    });
  }
  attachReelCardHover();

  // Blackboard cards: hover / tap video play for instant responsive feel
  function attachBlackboardCardHover() {
    document.querySelectorAll('.blackboard-card').forEach((card) => {
      const video = card.querySelector('.blackboard-reel-video');
      if (!video) return;

      card.addEventListener('mouseenter', () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      });

      card.addEventListener('mouseleave', () => {
        if (!video.paused) {
          video.pause();
        }
      });
    });
  }
  attachBlackboardCardHover();

  // -------------------------------------------------------------------------
  // 8. Artisanal Three.js Animated Coffee Flow System
  // Procedural WebGL liquid stream flowing strictly in the background (z-index: 0).
  // Originates at the small tipped craft cup below Hero ("small cup, too much coffee").
  // -------------------------------------------------------------------------
  function initThreeCoffeeFlow() {
    const canvas = document.getElementById('coffeeCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    let renderer, scene, camera, ribbonMesh, dropletsMesh;
    let ribbonGeo = null;
    let streamCurve = null;
    const uniforms = {
      uTime: { value: 0.0 },
      uScrollVelocity: { value: 0.0 },
    };

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(
        0,
        window.innerWidth,
        0,
        -window.innerHeight,
        -1000,
        1000
      );
      camera.position.z = 200;
    } catch (e) {
      console.warn('Three.js WebGL initialization skipped:', e);
      return;
    }

    // Helper to get element Y center in document space
    function getDocCenterY(selector, fallbackRatio) {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY + r.height * 0.5;
      }
      return document.documentElement.scrollHeight * fallbackRatio;
    }

    // Build the spline curve and 3D fluid ribbon mesh
    function buildStream() {
      if (ribbonMesh) {
        scene.remove(ribbonMesh);
        if (ribbonGeo) ribbonGeo.dispose();
      }
      if (dropletsMesh) {
        scene.remove(dropletsMesh);
      }

      const w = window.innerWidth;
      const totalH = Math.max(document.documentElement.scrollHeight, 6000);

      // Measure exact mouth marker position of the small tipped cup
      const mouthMarker = document.getElementById('spillCupMouthMarker');
      let cupX = w * 0.78;
      let cupY = window.innerHeight * 0.98;

      if (mouthMarker) {
        const mRect = mouthMarker.getBoundingClientRect();
        cupX = mRect.left + mRect.width * 0.5;
        cupY = mRect.top + window.scrollY + mRect.height * 0.5;
      }

      // 3D Spline Path:
      // Originates PRECISELY at the lip/mouth marker of the small falling cup ("Desk 14 · Small cup, too much coffee")
      // Launches along the cup's tilt angle (128°: down and towards the right gutter)
      // Curves gracefully and organically along lateral margins (NEVER cutting across menu text or creating diagonal 'X' crosses).
      const isMobile = w < 768;
      const rightGutter = isMobile ? Math.min(w * 0.95, w - 14) : Math.min(w * 0.94, w - 45);
      const leftGutter = Math.max(w * 0.05, 45);
      const center = w * 0.50;

      // Section vertical positions
      const storyTop = getDocCenterY('#story', 0.10);
      const originsY = getDocCenterY('#origins', 0.26);
      const mascotY = getDocCenterY('.mascot-delivery-section', 0.32);
      const menuY = getDocCenterY('#menu', 0.40);
      const menuEnd = getDocCenterY('.menu-download-bar', 0.45);
      const reelY = getDocCenterY('#reel', 0.52);
      const journalY = getDocCenterY('#journal', 0.60);
      const campusesY = getDocCenterY('#campuses', 0.70);
      const alumniY = getDocCenterY('#alumni', 0.80);
      const communityY = getDocCenterY('#community', 0.88);

      // Measure exact doodle guy stream entry / mouth marker for stream termination
      const doodleMarker = document.getElementById('coffeeTailMouthMarker');
      let tailX = center;
      let tailY = totalH - 320;
      let doodleStreamWidth = 29.0;

      const doodleImgEl = document.getElementById('doodleGuyImg');
      if (doodleImgEl) {
        const dRect = doodleImgEl.getBoundingClientRect();
        const imgW = dRect.width;
        if (imgW > 0) {
          doodleStreamWidth = (62 / 1024) * imgW;
          // Exactly 64.5% across the character image where the stream begins at row 0
          tailX = dRect.left + (660.5 / 1024) * imgW;
          // Overlap 16px into the top of the character image to guarantee zero visible seam
          tailY = dRect.top + window.scrollY + 16;
        }
      } else if (doodleMarker) {
        const dRect = doodleMarker.getBoundingClientRect();
        tailX = dRect.left + dRect.width * 0.5;
        tailY = dRect.top + window.scrollY + 16;
      }

      // Strictly monotonic downward laminar flow (no upward bends, no acute V cuts across content)
      let rawPoints;
      if (isMobile) {
        // On mobile: stream stays strictly along the far-right margin gutter so it NEVER obstructs headings or card text
        rawPoints = [
          { x: cupX, y: cupY },
          { x: Math.min(cupX + 16, rightGutter), y: cupY + 45 },
          { x: rightGutter, y: cupY + 120 },
          { x: rightGutter, y: storyTop + 300 },
          { x: rightGutter, y: originsY - 50 },
          { x: rightGutter, y: originsY + 250 },
          { x: rightGutter, y: mascotY - 50 },
          { x: rightGutter, y: mascotY + 250 },
          { x: rightGutter, y: menuY - 50 },
          { x: rightGutter, y: menuY + 300 },
          { x: rightGutter, y: menuEnd },
          { x: rightGutter, y: reelY },
          { x: rightGutter, y: journalY },
          { x: rightGutter, y: campusesY },
          { x: rightGutter, y: alumniY },
          { x: rightGutter, y: communityY },
          // At closing section, flow past the CTA buttons along the right gutter, then smoothly angle down-left straight into the doodle guy's mouth!
          { x: rightGutter, y: tailY - 140 },
          { x: tailX + 28, y: tailY - 60 },
          { x: tailX + 10, y: tailY - 20 },
          { x: tailX, y: tailY }
        ];
      } else {
        // Desktop: graceful serpentine curve framing content along margins
        rawPoints = [
          { x: cupX, y: cupY },
          { x: cupX + 35, y: cupY + 60 },
          { x: rightGutter, y: cupY + 220 },
          { x: rightGutter, y: storyTop + 400 },
          { x: rightGutter - 15, y: storyTop + 1200 },
          { x: rightGutter, y: storyTop + 2000 },
          { x: rightGutter - 10, y: originsY - 200 },
          { x: rightGutter, y: originsY + 250 },
          { x: rightGutter, y: mascotY - 100 },
          { x: rightGutter - 20, y: mascotY + 250 },
          { x: rightGutter - 10, y: menuY - 200 },
          { x: rightGutter, y: menuY + 400 },
          { x: rightGutter - 25, y: menuEnd },
          { x: w * 0.65, y: reelY - 300 },
          { x: w * 0.35, y: reelY + 200 },
          { x: leftGutter, y: reelY + 600 },
          { x: leftGutter + 15, y: journalY - 100 },
          { x: leftGutter, y: journalY + 300 },
          { x: w * 0.30, y: campusesY },
          { x: w * 0.55, y: campusesY + 500 },
          { x: w * 0.70, y: alumniY },
          { x: w * 0.45, y: communityY - 150 },
          { x: w * 0.55, y: communityY + 300 },
          { x: tailX + 48, y: tailY - 240 },
          { x: tailX + 22, y: tailY - 90 },
          { x: tailX, y: tailY }
        ];
      }

      // Ensure monotonic Y enforcement so it NEVER loops back under any screen resize
      for (let i = 1; i < rawPoints.length; i++) {
        if (rawPoints[i].y <= rawPoints[i - 1].y + 15) {
          rawPoints[i].y = rawPoints[i - 1].y + 40;
        }
      }

      const points = rawPoints.map(p => new THREE.Vector3(p.x, -p.y, 0));
      streamCurve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.15);

      // Construct Ribbon Geometry
      const divisions = 450;
      const positions = [];
      const uvs = [];
      const indices = [];

      for (let i = 0; i <= divisions; i++) {
        const t = i / divisions;
        const pt = streamCurve.getPoint(t);
        const tangent = streamCurve.getTangent(t);
        // Pure 2D perpendicular normal in the screen plane
        const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();

        // Width dynamics: Starts small (~16px) at cup mouth, expands into luscious viscous flow, tapers into doodle stream entry
        let streamWidth = 42.0;
        if (t < 0.04) {
          streamWidth = 16.0 + (t / 0.04) * 26.0;
        } else {
          // Viscous fluid ripples: natural gentle expanding & pinching pulses of pouring liquid
          const ripple = Math.sin(t * 24.0) * 4.0 + Math.cos(t * 52.0) * 2.2;
          streamWidth = 40.0 + ripple;
        }

        // Mobile responsive width scaling: sleek ribbon matching doodle character line art
        if (w < 768) streamWidth *= 0.44;

        // Smooth final taper directly into the doodle stream entry
        if (t > 0.94) {
          const factor = (t - 0.94) / 0.06;
          streamWidth = streamWidth * (1.0 - factor) + doodleStreamWidth * factor;
        }

        const pLeft = pt.clone().addScaledVector(normal, -streamWidth * 0.5);
        const pRight = pt.clone().addScaledVector(normal, streamWidth * 0.5);

        positions.push(pLeft.x, pLeft.y, 0.0);
        positions.push(pRight.x, pRight.y, 0.0);

        uvs.push(0.0, t);
        uvs.push(1.0, t);

        if (i < divisions) {
          const base = i * 2;
          indices.push(base, base + 1, base + 2);
          indices.push(base + 1, base + 3, base + 2);
        }
      }

      ribbonGeo = new THREE.BufferGeometry();
      ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      ribbonGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      ribbonGeo.setIndex(indices);
      ribbonGeo.computeVertexNormals();

      // Cel-Shaded Pop-Art / Flat Editorial Coffee Shader Material (Matching Doodle Guy character)
      const ribbonMat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          uniform float uTime;

          void main() {
            vUv = uv;
            vec3 pos = position;

            // Damping at both extremities for seamless anchoring
            float mouthDamping = smoothstep(0.0, 0.04, vUv.y);
            float tailDamping = smoothstep(1.0, 0.96, vUv.y);
            float damp = mouthDamping * tailDamping;

            // Subtle lateral fluid sway along X (very gentle organic liquid motion)
            pos.x += sin(pos.y * 0.003 + uTime * 2.0) * 3.5 * damp;

            vPosition = pos;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          uniform float uTime;
          uniform float uScrollVelocity;

          void main() {
            // Lateral coordinate across the stream width: 0 at center, 1 at edge
            float lateral = abs(vUv.x - 0.5) * 2.0;

            // 1. Dark Ink Contour Outlines (matching character's bold contour lines)
            // Outer 14% on both left and right is the dark ink border
            float outlineThresh = 0.84;
            float isOutline = smoothstep(outlineThresh - 0.02, outlineThresh + 0.02, lateral);
            vec3 inkOutline = vec3(0.05, 0.015, 0.01); // #0d0403 dark espresso ink outline

            // 2. Rich Roasted Flat Coffee Fill (matching #964a18 from doodle-guy.png)
            vec3 deepRoast = vec3(0.46, 0.21, 0.07);   // #753512 rich extraction base
            vec3 warmCoffee = vec3(0.59, 0.29, 0.09);  // #964a18 authentic character roast
            vec3 caramel = vec3(0.72, 0.40, 0.16);     // #b86629 warm caramel tone

            // Cel-shaded tone across the liquid core
            vec3 fillColor = mix(warmCoffee, deepRoast, smoothstep(0.1, 0.82, lateral));

            // Dynamic flowing fluid ripples (subtle organic tone shift)
            float flow = vUv.y * 32.0 - uTime * 3.0 - uScrollVelocity * 0.015;
            float flowWave = sin(flow) * 0.5 + 0.5;
            fillColor = mix(fillColor, caramel, flowWave * 0.12);

            // 3. Stylized Flat Glossy Pop-Art Highlight Ribbon (matching #dda175 highlight in illustration)
            // Crisp cel-shaded streak running along one side of the stream
            float highlightPos = 0.30 + sin(vUv.y * 14.0 - uTime * 2.2) * 0.035;
            float highlightDist = abs(vUv.x - highlightPos);
            float highlight = smoothstep(0.085, 0.02, highlightDist); // crisp cel-shaded edge
            vec3 popHighlight = vec3(0.87, 0.63, 0.46); // #dda175 warm cream caramel
            vec3 glossCore = vec3(0.98, 0.94, 0.86);     // #faf0dc light cream shine core
            vec3 highlightTotal = mix(popHighlight, glossCore, smoothstep(0.035, 0.01, highlightDist));

            fillColor = mix(fillColor, highlightTotal, highlight * 0.85);

            // Blend fill with the dark ink outline
            vec3 finalColor = mix(fillColor, inkOutline, isOutline);

            // Microscopic antialiasing at the absolute edge
            float edgeDist = min(vUv.x, 1.0 - vUv.x);
            float alpha = smoothstep(0.002, 0.025, edgeDist);

            // Clean fade-in at the cup mouth
            alpha *= smoothstep(0.0, 0.015, vUv.y);

            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
      scene.add(ribbonMesh);

      // Floating Cel-Shaded Cartoon Splash Droplets along stream
      const dropletCount = 90;
      const dropletPositions = new Float32Array(dropletCount * 3);
      const dropletSizes = new Float32Array(dropletCount);

      for (let i = 0; i < dropletCount; i++) {
        const t = 0.03 + (i / dropletCount) * 0.94;
        const pt = streamCurve.getPoint(t);
        const tangent = streamCurve.getTangent(t);
        const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();

        // Organic dispersal: droplets peel off and trail the main pour
        const maxSpread = isMobile ? 8.0 : 36.0;
        const subSpread = isMobile ? 5.0 : 22.0;
        const lateralSpread = (Math.sin(i * 2.3) * maxSpread + Math.cos(i * 1.7) * subSpread);
        const dPos = pt.clone().addScaledVector(normal, lateralSpread);

        dropletPositions[i * 3] = dPos.x;
        dropletPositions[i * 3 + 1] = dPos.y;
        dropletPositions[i * 3 + 2] = 0.0;

        // Droplet sizes: small micro-drops to rich cartoon splash drops
        dropletSizes[i] = isMobile ? (4.2 + (i % 4) * 1.4) : (10.0 + (i % 5) * 2.4);
      }

      const dropletGeo = new THREE.BufferGeometry();
      dropletGeo.setAttribute('position', new THREE.BufferAttribute(dropletPositions, 3));
      dropletGeo.setAttribute('size', new THREE.BufferAttribute(dropletSizes, 1));

      // Circular droplet shader material for cel-shaded pop-art cartoon droplets
      const dropletMat = new THREE.ShaderMaterial({
        vertexShader: `
          attribute float size;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.48) discard;

            // Dark ink contour border on each droplet
            float outline = smoothstep(0.32, 0.44, dist);
            vec3 ink = vec3(0.05, 0.015, 0.01);
            vec3 coffee = vec3(0.59, 0.29, 0.09); // #964a18

            // Stylized cel-shaded specular shine dot on top-left of droplet
            float shineDist = length(gl_PointCoord - vec2(0.36, 0.36));
            float shine = smoothstep(0.12, 0.04, shineDist);
            vec3 gloss = vec3(0.96, 0.88, 0.78);

            vec3 col = mix(coffee, gloss, shine * 0.9);
            col = mix(col, ink, outline);

            gl_FragColor = vec4(col, 1.0);
          }
        `,
        transparent: true,
        depthWrite: false,
      });

      dropletsMesh = new THREE.Points(dropletGeo, dropletMat);
      scene.add(dropletsMesh);
    }

    // Build the initial 3D stream
    buildStream();

    // Rebuild when character illustration image loads
    const doodleImgEl = document.getElementById('doodleGuyImg');
    if (doodleImgEl && !doodleImgEl.complete) {
      doodleImgEl.addEventListener('load', () => {
        setTimeout(buildStream, 50);
      });
    }

    // Rebuild on window load to ensure settled coordinates of doodle marker
    window.addEventListener('load', () => {
      setTimeout(buildStream, 200);
    });

    // Rebuild on window resize or layout change
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.right = window.innerWidth;
        camera.bottom = -window.innerHeight;
        camera.updateProjectionMatrix();
        buildStream();
      }, 150);
    });

    // Animation & Scroll Loop
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    function render(now) {
      requestAnimationFrame(render);

      const time = now * 0.001;
      uniforms.uTime.value = time;

      const currentScrollY = window.scrollY;
      const deltaScroll = Math.abs(currentScrollY - lastScrollY);
      scrollVelocity += (deltaScroll - scrollVelocity) * 0.12;
      lastScrollY = currentScrollY;

      uniforms.uScrollVelocity.value = scrollVelocity;

      // 1:1 Camera Scroll Mapping
      camera.position.y = -currentScrollY;

      // Gentle bobbing of ambient droplets
      if (dropletsMesh) {
        dropletsMesh.position.y = Math.sin(time * 1.5) * 6.0;
        dropletsMesh.position.x = Math.cos(time * 1.2) * 4.0;
      }

      renderer.render(scene, camera);
    }

    requestAnimationFrame(render);
  }

  // Initialize Three.js Animated Coffee Flow
  initThreeCoffeeFlow();

  if (hasGsap && hasScrollTrigger && !prefersReducedMotion) {
    // Storytelling floating elements parallax
    gsap.utils.toArray('.hero-float-mug, .hero-float-beans, .origins-floating-accent, .menu-floating-accent, .alumni-floating-mug-wrap').forEach((el) => {
      const speed = parseFloat(el.getAttribute('data-speed') || '0.25');
      gsap.to(el, {
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
        y: -80 * speed,
        rotation: speed > 0.3 ? 7 : -4,
        ease: 'none',
      });
    });
  }

  // -------------------------------------------------------------------------
  // 9. GSAP Animations (Subtle & Resilient)
  // -------------------------------------------------------------------------
  if (hasGsap && !prefersReducedMotion) {
    // Reveal Bottom Wide Capsule
    gsap.from('.hero-wide-capsule', {
      y: 40,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      delay: 0.3,
    });

    if (hasScrollTrigger) {
      // Section Titles Reveal
      document.querySelectorAll('.section-title').forEach((title) => {
        gsap.from(title, {
          scrollTrigger: {
            trigger: title,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
          y: 25,
          duration: 0.75,
          ease: 'power2.out',
        });
      });

      // Bento Cards Stagger In
      document.querySelectorAll('.bento-grid').forEach((grid) => {
        const cards = grid.querySelectorAll('.notebook-spiral-card, .bento-card');
        if (cards && cards.length > 0) {
          gsap.from(cards, {
            scrollTrigger: {
              trigger: grid,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
            y: 35,
            stagger: 0.12,
            duration: 0.8,
            ease: 'power3.out',
          });
        }
      });

      // Story Polaroid Frame Rotation
      const polaroid = document.querySelector('.polaroid-frame');
      const storyVisual = document.querySelector('.story-scrolly-stage, .story-manuscript-col');
      if (polaroid && storyVisual) {
        gsap.from(polaroid, {
          scrollTrigger: {
            trigger: storyVisual,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          rotation: 4,
          scale: 0.96,
          duration: 0.9,
          ease: 'power3.out',
        });
      }

      // Campus Cards Slide In
      const campusCards = document.querySelectorAll('.campus-card');
      if (campusCards.length >= 2) {
        gsap.from(campusCards[0], {
          scrollTrigger: {
            trigger: '.campuses-grid',
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          x: -30,
          duration: 0.85,
          ease: 'power3.out',
        });
        gsap.from(campusCards[1], {
          scrollTrigger: {
            trigger: '.campuses-grid',
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          x: 30,
          duration: 0.85,
          ease: 'power3.out',
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // SBC REEL — Sound toggle for all 6 video cards
  // -------------------------------------------------------------------------
  document.querySelectorAll('.reel-card').forEach((card) => {
    const video = card.querySelector('.reel-video');
    const soundBtn = card.querySelector('.reel-sound-btn');
    if (!video || !soundBtn) return;

    soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (video.muted) {
        // Mute all others first (only one video unmuted at a time)
        document.querySelectorAll('.reel-video').forEach((v) => {
          v.muted = true;
        });
        document.querySelectorAll('.reel-sound-btn').forEach((b) => {
          b.classList.remove('is-unmuted');
        });
        // Then unmute this one
        video.muted = false;
        soundBtn.classList.add('is-unmuted');
      } else {
        video.muted = true;
        soundBtn.classList.remove('is-unmuted');
      }
    });
  });

  // -------------------------------------------------------------------------
  // SBC REEL — Staggered scroll reveal via GSAP ScrollTrigger
  // -------------------------------------------------------------------------
  if (!prefersReducedMotion && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.from('.reel-card', {
      scrollTrigger: {
        trigger: '.reel-grid',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
      y: 50,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power3.out',
    });

    gsap.from('.section-heading-reel', {
      scrollTrigger: {
        trigger: '.reel-section',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    });

    // Section H — Final Brand Moment Reveal
    gsap.from('.final-brand-heading', {
      scrollTrigger: {
        trigger: '.final-brand-section',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      y: 45,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.out',
    });

    gsap.from('.final-cta-group', {
      scrollTrigger: {
        trigger: '.final-brand-section',
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
      y: 30,
      opacity: 0,
      duration: 0.8,
      delay: 0.15,
      ease: 'power3.out',
    });
  }

  // -------------------------------------------------------------------------
  // 11. INTERACTIVE COFFEE PERSONA & FLAVOR MATCHER
  // -------------------------------------------------------------------------
  const quizSteps = [
    document.getElementById('quizStep1'),
    document.getElementById('quizStep2'),
    document.getElementById('quizStep3')
  ];
  const quizResultView = document.getElementById('quizResultView');
  const quizProgressBar = document.getElementById('quizProgressBar');
  const restartQuizBtn = document.getElementById('restartQuizBtn');
  const resultPersona = document.getElementById('resultPersona');
  const resultDrink = document.getElementById('resultDrink');
  const resultDesc = document.getElementById('resultDesc');
  const resultBadge = document.getElementById('resultBadge');

  let currentQuizStep = 0;
  const userAnswers = [];

  const personas = {
    biscoff: {
      title: 'The Speculoos Connoisseur',
      drink: 'Signature Teddy Bear Biscoff Cold Brew',
      badge: 'CREATIVE DAYDREAMER',
      desc: 'You love turning classroom daydreams into artisanal indulgence. 18-hour cold brew layered with velvety Belgian Biscoff foam and crunchy caramelized speculoos.'
    },
    purist: {
      title: 'The 9.2-Bar Purist',
      drink: 'Double Ristretto + Almond Croissant',
      badge: 'PRECISION CRAFT',
      desc: 'You appreciate unyielding extraction science and intense crema. Dialed in every morning on 9-bar commercial groups with dark cacao and hazelnut warmth.'
    },
    floral: {
      title: 'The Estate Chemist',
      drink: 'Chikmagalur Single-Origin V60 Pour',
      badge: 'TERROIR EXPLORER',
      desc: 'You cherish delicate nuance, origin elevation, and clean cup clarity. Light-to-medium roast with wild jasmine, bergamot, and sweet stonefruit notes.'
    }
  };

  if (quizSteps[0]) {
    document.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const value = this.getAttribute('data-value');
        userAnswers.push(value);

        // Advance to next step or result
        quizSteps[currentQuizStep].classList.remove('active');
        currentQuizStep++;

        if (currentQuizStep < quizSteps.length) {
          quizSteps[currentQuizStep].classList.add('active');
          if (quizProgressBar) {
            quizProgressBar.style.width = ((currentQuizStep + 1) / 3 * 100) + '%';
          }
        } else {
          // Reveal result
          if (quizProgressBar) quizProgressBar.style.width = '100%';
          const finalChoice = userAnswers[2] || userAnswers[0] || 'biscoff';
          const profile = personas[finalChoice] || personas.biscoff;

          if (resultPersona) resultPersona.textContent = profile.title;
          if (resultDrink) resultDrink.textContent = profile.drink;
          if (resultBadge) resultBadge.textContent = profile.badge;
          if (resultDesc) resultDesc.textContent = profile.desc;

          quizResultView.classList.add('active');
        }
      });
    });

    if (restartQuizBtn) {
      restartQuizBtn.addEventListener('click', () => {
        userAnswers.length = 0;
        currentQuizStep = 0;
        quizResultView.classList.remove('active');
        quizSteps.forEach(s => s && s.classList.remove('active'));
        quizSteps[0].classList.add('active');
        if (quizProgressBar) quizProgressBar.style.width = '33.33%';
      });
    }
  }

  // -------------------------------------------------------------------------
  // 12. STUDY DESK 14 LIVE INTERACTIVE GUESTBOOK
  // -------------------------------------------------------------------------
  const deskNoteForm = document.getElementById('deskNoteForm');
  const deskNotesWall = document.getElementById('deskNotesWall');
  const deskAuthorInput = document.getElementById('deskAuthorInput');
  const deskCampusInput = document.getElementById('deskCampusInput');
  const deskMessageInput = document.getElementById('deskMessageInput');

  if (deskNoteForm && deskNotesWall) {
    const pinColors = ['#E23744', '#2563EB', '#059669', '#D97706', '#9333EA'];

    deskNoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const author = deskAuthorInput.value.trim();
      const campus = deskCampusInput.value;
      const message = deskMessageInput.value.trim();

      if (!author || !message) return;

      const randomRotation = (Math.random() * 5 - 2.5).toFixed(1);
      const randomColor = pinColors[Math.floor(Math.random() * pinColors.length)];

      const newNote = document.createElement('div');
      newNote.className = 'desk-sticky-note';
      newNote.style.transform = `rotate(${randomRotation}deg)`;
      newNote.innerHTML = `
        <div class="sticky-pin" style="background: ${randomColor};"></div>
        <span class="sticky-author">${escapeHtml(author.toUpperCase())} · ${escapeHtml(campus)}</span>
        <p class="sticky-message">"${escapeHtml(message)}"</p>
      `;

      // Prepend to desk
      deskNotesWall.prepend(newNote);
      deskNotesWall.scrollTop = 0;

      // Reset form
      deskAuthorInput.value = '';
      deskMessageInput.value = '';

      // Subtle feedback on submit button
      const submitBtn = deskNoteForm.querySelector('.desk-submit-btn');
      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>✨ Pinned to Desk 14!</span>';
        submitBtn.style.background = '#059669';
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.style.background = '';
        }, 2200);
      }
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // -------------------------------------------------------------------------
  // 12B. EDITORIAL JOURNAL STOP-SCROLL ANIMATION & CHAPTER SLIDES
  // -------------------------------------------------------------------------
  const journalSection = document.getElementById('journal');
  const journalChapterBtns = document.querySelectorAll('.journal-chapter-btn');
  const journalCards = document.querySelectorAll('.journal-card');
  const journalDots = document.querySelectorAll('.journal-dot');
  const journalDeck = document.getElementById('journalManuscriptsDeck');

  let currentJournalIndex = 0;

  function setJournalSlide(index) {
    if (index < 0 || index >= journalCards.length) return;
    currentJournalIndex = index;

    // Update Manuscript cards
    journalCards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    // Update Chapter Buttons
    journalChapterBtns.forEach((btn, i) => {
      const isActive = i === index;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update Mobile Dots
    journalDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  // Click on chapter button
  if (journalChapterBtns.length > 0) {
    journalChapterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const slide = parseInt(btn.getAttribute('data-journal-slide'), 10);
        setJournalSlide(slide);
      });
    });
  }

  // Click on mobile dot
  if (journalDots.length > 0) {
    journalDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const slide = parseInt(dot.getAttribute('data-slide'), 10);
        setJournalSlide(slide);
        if (journalDeck && window.innerWidth < 992) {
          const targetCard = journalCards[slide];
          if (targetCard) {
            journalDeck.scrollTo({
              left: targetCard.offsetLeft - journalDeck.offsetLeft,
              behavior: 'smooth'
            });
          }
        }
      });
    });
  }

  // Mobile horizontal swipe observer
  if (journalDeck && window.innerWidth < 992) {
    journalDeck.addEventListener('scroll', () => {
      const scrollLeft = journalDeck.scrollLeft;
      const width = journalDeck.clientWidth * 0.8;
      const index = Math.round(scrollLeft / width);
      if (index >= 0 && index < journalDots.length && index !== currentJournalIndex) {
        currentJournalIndex = index;
        journalDots.forEach((dot, i) => dot.classList.toggle('active', i === index));
      }
    }, { passive: true });
  }

  // Desktop Editorial Journal Slide Sync (Non-pinning: Native CSS sticky handles left guide column)
  if (journalSection && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: journalSection,
      start: 'top 70%',
      end: 'bottom 30%',
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress;
        const totalSlides = journalCards.length;
        if (totalSlides > 0) {
          const targetIndex = Math.min(Math.floor(progress * totalSlides), totalSlides - 1);
          if (targetIndex !== currentJournalIndex) {
            setJournalSlide(targetIndex);
          }
        }
      }
    });
  }

  // Dynamic Sync of Blog Posts with REST API (reflects live Desk 14 CMS edits)
  async function syncBlogData() {
    try {
      const res = await fetch('/api/blog/posts');
      if (res.ok) {
        const posts = await res.json();
        const published = (posts || []).filter(p => p.published);
        if (published.length > 0 && journalDeck) {
          journalDeck.innerHTML = published.map((post, idx) => `
            <article class="journal-card ${idx === 0 ? 'active' : ''}" data-slide-index="${idx}">
              <div class="journal-card-cover">
                <img src="${post.coverImage || 'hero-coffee.jpg'}" alt="${post.title}" class="journal-cover-img" loading="lazy">
                <div class="journal-card-badges">
                  <span class="badge-cat">${post.category || 'Brewing Guides'}</span>
                  <span class="badge-time">⏱️ ${post.readTime || '4 min read'}</span>
                </div>
              </div>
              <div class="journal-card-body">
                <div class="journal-card-author">
                  <span class="author-icon">✒️</span>
                  <span class="author-name">${post.author || 'Arpit · Founder (Desk 14)'}</span>
                  <span class="author-dot">·</span>
                  <span class="pub-date">${new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                <h3 class="journal-card-title">${post.title}</h3>
                <p class="journal-card-excerpt">${post.excerpt || ''}</p>
                <div class="journal-card-action">
                  <a href="/blog/${post.slug}" class="btn-read-dispatch">
                    <span>Read Full Dispatch ↗</span>
                  </a>
                </div>
              </div>
            </article>
          `).join('');

          const chapterNav = document.querySelector('.journal-chapter-nav');
          if (chapterNav) {
            chapterNav.innerHTML = published.map((post, idx) => `
              <button class="journal-chapter-btn ${idx === 0 ? 'active' : ''}" data-journal-slide="${idx}" role="tab" aria-selected="${idx === 0 ? 'true' : 'false'}">
                <span class="chapter-num">DISPATCH 0${idx + 1}</span>
                <span class="chapter-title">${(post.title || '').split(':')[0]}</span>
              </button>
            `).join('');
          }

          const dotsWrap = document.querySelector('.journal-mobile-nav');
          if (dotsWrap) {
            dotsWrap.innerHTML = published.map((_, idx) => `
              <button class="journal-dot ${idx === 0 ? 'active' : ''}" data-slide="${idx}"></button>
            `).join('');
          }

          bindJournalEvents();
        }
      }
    } catch (err) {
      console.warn('Blog API sync note:', err);
    }
  }

  function bindJournalEvents() {
    const updatedChapterBtns = document.querySelectorAll('.journal-chapter-btn');
    const updatedCards = document.querySelectorAll('.journal-card');
    const updatedDots = document.querySelectorAll('.journal-dot');

    updatedChapterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const slide = parseInt(btn.getAttribute('data-journal-slide'), 10);
        setJournalSlide(slide);
      });
    });

    updatedDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const slide = parseInt(dot.getAttribute('data-slide'), 10);
        setJournalSlide(slide);
        if (journalDeck && window.innerWidth < 992) {
          const targetCard = updatedCards[slide];
          if (targetCard) {
            journalDeck.scrollTo({
              left: targetCard.offsetLeft - journalDeck.offsetLeft,
              behavior: 'smooth'
            });
          }
        }
      });
    });
  }

  syncBlogData();

  // -------------------------------------------------------------------------
  // 13. COMMUNITY & REAL EVENT GALLERY (Classroom Blackboard + Instagram Reels)
  // -------------------------------------------------------------------------
  const galleryFilterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryGrid = document.getElementById('communityGalleryGrid');
  const galleryLightbox = document.getElementById('galleryLightbox');
  const lightboxBackdrop = document.getElementById('galleryLightboxBackdrop');
  const closeGalleryLightbox = document.getElementById('closeGalleryLightbox');
  const galleryPrevBtn = document.getElementById('galleryPrevBtn');
  const galleryNextBtn = document.getElementById('galleryNextBtn');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const lightboxTag = document.getElementById('lightboxTag');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxCaption = document.getElementById('lightboxCaption');

  let activeGalleryItems = [];
  let currentLightboxIndex = 0;

  function updateGalleryActiveList() {
    activeGalleryItems = Array.from(document.querySelectorAll('.gallery-card:not([style*="display: none"])'));
  }

  function openLightbox(index) {
    if (!activeGalleryItems.length || index < 0 || index >= activeGalleryItems.length) return;
    currentLightboxIndex = index;
    const card = activeGalleryItems[index];
    const img = card.querySelector('.gallery-card-img');
    const video = card.querySelector('video');
    const videoSrc = card.getAttribute('data-video') || (video && video.querySelector('source') ? video.querySelector('source').src : '');
    const badge = card.querySelector('.gallery-card-badge') || card.querySelector('.blackboard-event-tag');
    const title = card.querySelector('.gallery-card-title');
    const caption = card.querySelector('.gallery-card-caption');

    if (videoSrc) {
      if (lightboxVideo) {
        lightboxVideo.style.display = 'block';
        lightboxVideo.src = videoSrc;
        lightboxVideo.play().catch(() => {});
      }
      if (lightboxImg) lightboxImg.style.display = 'none';
    } else {
      if (lightboxVideo) {
        lightboxVideo.style.display = 'none';
        lightboxVideo.pause();
        lightboxVideo.removeAttribute('src');
      }
      if (lightboxImg && img) {
        lightboxImg.style.display = 'block';
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || '';
      }
    }

    if (lightboxTag && badge) lightboxTag.textContent = badge.textContent;
    if (lightboxTitle && title) lightboxTitle.textContent = title.textContent;
    if (lightboxCaption && caption) lightboxCaption.textContent = caption.textContent;

    if (galleryLightbox) {
      galleryLightbox.classList.add('active');
      galleryLightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightboxModal() {
    if (galleryLightbox) {
      galleryLightbox.classList.remove('active');
      galleryLightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lightboxVideo) {
        lightboxVideo.pause();
        lightboxVideo.removeAttribute('src');
      }
    }
  }

  function nextLightbox() {
    if (!activeGalleryItems.length) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % activeGalleryItems.length;
    openLightbox(currentLightboxIndex);
  }

  function prevLightbox() {
    if (!activeGalleryItems.length) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + activeGalleryItems.length) % activeGalleryItems.length;
    openLightbox(currentLightboxIndex);
  }

  // Filter Buttons
  if (galleryFilterBtns.length > 0) {
    galleryFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        galleryFilterBtns.forEach(b => b.classList.toggle('active', b === btn));

        const cards = document.querySelectorAll('.gallery-card');
        cards.forEach(card => {
          const cat = card.getAttribute('data-category');
          if (filter === 'all' || cat === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
        updateGalleryActiveList();
      });
    });
  }

  // Card click triggers lightbox
  function wireGalleryCardClicks() {
    updateGalleryActiveList();
    document.querySelectorAll('.gallery-card').forEach(card => {
      card.addEventListener('click', () => {
        updateGalleryActiveList();
        const idx = activeGalleryItems.indexOf(card);
        if (idx !== -1) openLightbox(idx);
      });
    });
  }
  wireGalleryCardClicks();

  if (closeGalleryLightbox) closeGalleryLightbox.addEventListener('click', closeLightboxModal);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightboxModal);
  if (galleryNextBtn) galleryNextBtn.addEventListener('click', nextLightbox);
  if (galleryPrevBtn) galleryPrevBtn.addEventListener('click', prevLightbox);

  // Sync Gallery with REST API dynamically
  async function syncGalleryData() {
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const items = await res.json();
        if (items && items.length > 0 && galleryGrid) {
          galleryGrid.innerHTML = items.map((item, i) => `
            <article class="gallery-card blackboard-card" data-category="${item.category}" data-index="${i}" data-video="${item.video || ''}">
              <div class="blackboard-clip" aria-hidden="true"></div>
              <div class="gallery-card-media blackboard-card-media">
                ${item.video ? `
                  <video class="blackboard-reel-video" muted loop playsinline preload="none">
                    <source src="${item.video}" type="video/mp4">
                  </video>
                  <img src="${item.image}" alt="${item.title}" class="gallery-card-img" loading="lazy">
                ` : `
                  <img src="${item.image}" alt="${item.title}" class="gallery-card-img" loading="lazy">
                `}
                <span class="gallery-card-badge">${item.categoryLabel || item.category}</span>
                <span class="blackboard-reel-badge">▶ SBC REEL · ${item.reelHandle || '@sectionbcoffee.india'}</span>
                <div class="gallery-card-hover-overlay">
                  <span class="gallery-expand-icon">🔍 Full Reel & View</span>
                </div>
              </div>
              <div class="gallery-card-info blackboard-card-info">
                <span class="blackboard-event-tag">${item.tag || item.categoryLabel || 'Campus Event'}</span>
                <h4 class="gallery-card-title">${item.title}</h4>
                <p class="gallery-card-caption">${item.caption}</p>
              </div>
            </article>
          `).join('');
          wireGalleryCardClicks();
          attachBlackboardCardHover();
        }
      }
    } catch (err) {
      console.warn('Gallery API sync note:', err);
    }
  }
  syncGalleryData();

  // -------------------------------------------------------------------------
  // 13B. ALUMNI REVIEW DISPATCH SUBMISSION MODAL
  // -------------------------------------------------------------------------
  const openReviewModalBtn = document.getElementById('openReviewModalBtn');
  const reviewModal = document.getElementById('reviewModal');
  const reviewModalBackdrop = document.getElementById('reviewModalBackdrop');
  const closeReviewModal = document.getElementById('closeReviewModal');
  const submitReviewForm = document.getElementById('submitReviewForm');

  function openReviewModal() {
    if (reviewModal) {
      reviewModal.classList.add('active');
      reviewModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeReviewModalFn() {
    if (reviewModal) {
      reviewModal.classList.remove('active');
      reviewModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (openReviewModalBtn) openReviewModalBtn.addEventListener('click', openReviewModal);
  if (closeReviewModal) closeReviewModal.addEventListener('click', closeReviewModalFn);
  if (reviewModalBackdrop) reviewModalBackdrop.addEventListener('click', closeReviewModalFn);

  if (submitReviewForm) {
    submitReviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const reviewData = {
        name: document.getElementById('reviewName').value.trim(),
        role: document.getElementById('reviewRole').value.trim(),
        rating: parseInt(document.getElementById('reviewRating').value, 10) || 5,
        favoriteOrder: document.getElementById('reviewFavorite').value.trim(),
        quote: document.getElementById('reviewQuote').value.trim()
      };

      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewData)
        });

        if (res.ok) {
          closeReviewModalFn();
          submitReviewForm.reset();
          alert('✦ Alumni Dispatch Submitted!\nYour review has been received and will appear on the Honor Roll once verified by Desk 14.');
        } else {
          alert('Could not submit review at this time. Please try again.');
        }
      } catch (err) {
        alert('Network error submitting review.');
      }
    });
  }

  // Dynamic Sync of Alumni Reviews with REST API (reflects live Desk 14 CMS approvals)
  async function syncReviewsData() {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const reviews = await res.json();
        const grid = document.querySelector('.alumni-grid.notebook-pinboard-grid');
        if (reviews && reviews.length > 0 && grid) {
          const themes = ['note-yellow-legal', 'note-graph-paper', 'note-kraft-paper', 'note-sage-wash'];
          const avatarThemes = ['avatar-forest', 'avatar-caramel', 'avatar-espresso'];
          grid.innerHTML = reviews.map((r, i) => {
            const themeClass = themes[i % themes.length];
            const avTheme = avatarThemes[i % avatarThemes.length];
            const tilt = (i % 2 === 0 ? -2.2 : 2.2);
            return `
              <article class="alumni-card note-sticky ${themeClass}" data-tilt="${tilt}">
                <div class="note-pin pin-brass" aria-hidden="true"></div>
                ${i === 0 ? `
                  <svg class="coffee-stain-ring coffee-stain-sm" style="bottom: -15px; right: 10px; opacity: 0.45;" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M 80 14 C 117 13 147 43 146 80 C 145 117 115 147 79 146 C 43 145 13 115 14 79 C 15 42 44 15 80 14 Z" stroke="#5a270e" stroke-width="6.5" stroke-linecap="round" stroke-dasharray="115 16 75 22" opacity="0.48" />
                    <path d="M 82 20 C 113 21 140 48 139 80 C 138 112 111 139 79 138 C 47 137 20 110 21 80 C 22 48 51 19 82 20 Z" stroke="#8a441e" stroke-width="2.8" opacity="0.32" />
                    <circle cx="80" cy="80" r="52" fill="#c87d32" opacity="0.05" />
                  </svg>
                ` : ''}
                <div class="alumni-card-top">
                  <div class="alumni-avatar ${avTheme}">${r.initials || 'SBC'}</div>
                  <div class="alumni-author-info">
                    <h4 class="alumni-name">${r.name}</h4>
                    <span class="alumni-badge">${r.role || 'Class of Section-B · Regular'}</span>
                  </div>
                  <div class="alumni-rating" aria-label="${r.rating || 5} out of 5 stars">
                    ${'★'.repeat(r.rating || 5)}
                  </div>
                </div>
                <blockquote class="alumni-quote note-handwriting">
                  “${r.quote}”
                </blockquote>
                ${r.favoriteOrder ? `
                  <div class="alumni-card-footer note-order-stamp">
                    <span class="alumni-favorite-label">✦ Order Slip:</span>
                    <span class="alumni-favorite-item">${r.favoriteOrder}</span>
                  </div>
                ` : ''}
              </article>
            `;
          }).join('');
        }
      }
    } catch (err) {
      console.warn('Reviews API sync note:', err);
    }
  }

  syncReviewsData();

  // -------------------------------------------------------------------------
  // 13C. STEALTH ADMIN TRIGGER (Desk 14 Secret Protocol)
  // -------------------------------------------------------------------------
  const stealthTrigger = document.getElementById('stealthAdminTrigger');
  let stealthClickCount = 0;
  let stealthTimer = null;

  if (stealthTrigger) {
    stealthTrigger.addEventListener('click', () => {
      stealthClickCount++;
      clearTimeout(stealthTimer);
      stealthTimer = setTimeout(() => { stealthClickCount = 0; }, 2000);
      if (stealthClickCount >= 3) {
        window.location.href = '/stealth-desk-14';
      }
    });
  }

  // Keyboard shortcut: Ctrl + Shift + A (or Cmd + Shift + A)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      window.location.href = '/stealth-desk-14';
    }
    // Also handle Lightbox keyboard navigation
    if (galleryLightbox && galleryLightbox.classList.contains('active')) {
      if (e.key === 'Escape') closeLightboxModal();
      if (e.key === 'ArrowRight') nextLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
    }
    if (reviewModal && reviewModal.classList.contains('active')) {
      if (e.key === 'Escape') closeReviewModalFn();
    }
  });

  // -------------------------------------------------------------------------
  // 14. BORN IN SECTION-B: STOP-SCROLL SCROLLYTELLING & CHAPTER NAV
  // -------------------------------------------------------------------------
  const storySection = document.getElementById('story');
  const timelinePills = document.querySelectorAll('.story-timeline-pill');
  const manuscriptCards = document.querySelectorAll('.story-manuscript-card');
  const visualSlides = document.querySelectorAll('.story-visual-slide');
  const storyProgressBar = document.getElementById('storyProgressBar');
  let currentStoryChapter = 0;
  const totalStoryChapters = 4;

  function setActiveChapter(index, fromScroll = false) {
    if (index < 0 || index >= totalStoryChapters) return;
    currentStoryChapter = index;

    // Update Pills
    timelinePills.forEach((pill, idx) => {
      const isActive = idx === index;
      pill.classList.toggle('active', isActive);
      pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update Progress Bar
    if (storyProgressBar) {
      storyProgressBar.style.width = `${((index + 1) / totalStoryChapters) * 100}%`;
    }

    // Update Manuscripts
    manuscriptCards.forEach((card, idx) => {
      const isActive = idx === index;
      card.classList.toggle('active', isActive);
    });

    // Update Visual Slides
    visualSlides.forEach((slide, idx) => {
      const isActive = idx === index;
      slide.classList.toggle('active', isActive);
      // Play video if slide contains video
      const vid = slide.querySelector('video');
      if (vid) {
        if (isActive) {
          vid.play().catch(() => {});
        }
      }
    });

    // Update Prev / Next Buttons in the active card
    const activeCard = manuscriptCards[index];
    if (activeCard) {
      const prevBtn = activeCard.querySelector('.manuscript-prev-btn');
      const nextBtn = activeCard.querySelector('.manuscript-next-btn');
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === totalStoryChapters - 1;
    }
  }

  let storyPinTrigger = null;
  let isProgrammaticStoryJump = false;

  // Pill click handlers
  timelinePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const chapterIdx = parseInt(pill.getAttribute('data-chapter'), 10);
      setActiveChapter(chapterIdx);
      if (storyPinTrigger) {
        isProgrammaticStoryJump = true;
        const targetProgress = (chapterIdx + 0.1) / totalStoryChapters;
        const targetScroll = storyPinTrigger.start + targetProgress * (storyPinTrigger.end - storyPinTrigger.start);
        if (lenis) {
          lenis.scrollTo(targetScroll, { duration: 0.8 });
        } else {
          window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
        setTimeout(() => { isProgrammaticStoryJump = false; }, 850);
      }
    });
  });

  // Next / Prev button listeners in manuscript cards
  manuscriptCards.forEach((card) => {
    const prevBtn = card.querySelector('.manuscript-prev-btn');
    const nextBtn = card.querySelector('.manuscript-next-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentStoryChapter > 0) {
          const prevChapter = currentStoryChapter - 1;
          setActiveChapter(prevChapter);
          if (storyPinTrigger) {
            isProgrammaticStoryJump = true;
            const targetProgress = (prevChapter + 0.1) / totalStoryChapters;
            const targetScroll = storyPinTrigger.start + targetProgress * (storyPinTrigger.end - storyPinTrigger.start);
            if (lenis) lenis.scrollTo(targetScroll, { duration: 0.8 });
            else window.scrollTo({ top: targetScroll, behavior: 'smooth' });
            setTimeout(() => { isProgrammaticStoryJump = false; }, 850);
          }
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentStoryChapter < totalStoryChapters - 1) {
          const nextChapter = currentStoryChapter + 1;
          setActiveChapter(nextChapter);
          if (storyPinTrigger) {
            isProgrammaticStoryJump = true;
            const targetProgress = (nextChapter + 0.1) / totalStoryChapters;
            const targetScroll = storyPinTrigger.start + targetProgress * (storyPinTrigger.end - storyPinTrigger.start);
            if (lenis) lenis.scrollTo(targetScroll, { duration: 0.8 });
            else window.scrollTo({ top: targetScroll, behavior: 'smooth' });
            setTimeout(() => { isProgrammaticStoryJump = false; }, 850);
          }
        }
      });
    }
  });

  // GSAP ScrollTrigger Pinned Stop-Scroll Scrollytelling
  if (storySection && hasGsap && hasScrollTrigger && !prefersReducedMotion) {
    ScrollTrigger.matchMedia({
      // Desktop / Tablet stop-scroll pinning
      '(min-width: 992px)': function () {
        storyPinTrigger = ScrollTrigger.create({
          trigger: storySection,
          start: 'top top+=65',
          end: '+=1800',
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (isProgrammaticStoryJump) return;
            const progress = self.progress;
            // Continuous progress bar sync
            if (storyProgressBar) {
              storyProgressBar.style.width = Math.max(8, Math.min(100, progress * 100)) + '%';
            }
            // Map 0-1 progress to 4 discrete chapters
            let step = Math.min(Math.floor(progress * totalStoryChapters), totalStoryChapters - 1);
            if (step !== currentStoryChapter) {
              setActiveChapter(step, true);
            }
          },
        });
      },
      // Mobile / Compact screen behavior (no pin, responsive tab switching)
      '(max-width: 991px)': function () {
        // Tab switching remains active and fluid
      }
    });
  }

  // -------------------------------------------------------------------------
  // 15. ENHANCED MENU CATEGORY FILTER (What We Brew & Bake)
  // -------------------------------------------------------------------------
  const menuFilterBtns = document.querySelectorAll('.menu-filter-btn');
  const menuItemCards = document.querySelectorAll('.menu-item-card');

  if (menuFilterBtns.length > 0 && menuItemCards.length > 0) {
    menuFilterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');

        // Update active filter button
        menuFilterBtns.forEach((b) => {
          const isActive = b === btn;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Filter cards
        menuItemCards.forEach((card) => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.classList.remove('is-hidden');
            // Retrigger subtle animation
            card.style.animation = 'none';
            card.offsetHeight; // force reflow
            card.style.animation = 'fadeIn 0.35s ease forwards';
          } else {
            card.classList.add('is-hidden');
          }
        });
      });
    });
  }

  // -------------------------------------------------------------------------
  // 16. INTERACTIVE SIMULATED PDF DOWNLOADS (Seasonal Menu Lookbook)
  // -------------------------------------------------------------------------
  const downloadMenuBtn = document.getElementById('downloadMenuBtn');
  const downloadToast = document.getElementById('downloadToast');
  const closeDownloadToast = document.getElementById('closeDownloadToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastDesc = document.getElementById('toastDesc');
  const toastIcon = document.getElementById('toastIcon');
  const toastProgressFill = document.getElementById('toastProgressFill');
  const toastStatusText = document.getElementById('toastStatusText');
  const toastPercent = document.getElementById('toastPercent');

  let downloadTimer = null;

  function triggerDownloadSimulation() {
    if (!downloadToast) {
      window.location.href = '/download-menu';
      return;
    }
    if (downloadTimer) clearInterval(downloadTimer);

    if (toastTitle) toastTitle.textContent = 'Downloading Section-B Official Menu...';
    if (toastDesc) toastDesc.textContent = 'Serving official high-resolution print menu (PDF · 44.9 MB).';
    if (toastIcon) toastIcon.textContent = '📄';
    if (toastProgressFill) toastProgressFill.style.width = '0%';
    if (toastStatusText) toastStatusText.textContent = 'Connecting to Section-B roastery repository...';
    if (toastPercent) toastPercent.textContent = '0%';

    downloadToast.classList.add('is-active');

    // Automatically trigger official PDF file download in browser
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = '/download-menu';
    downloadAnchor.download = 'Section-B-Coffee-Official-Menu.pdf';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    let currentProgress = 0;
    const steps = [
      { at: 25, text: 'Streaming Section-B specialty catalog...' },
      { at: 55, text: 'Packing cold brews, pour-overs & bakery spreads...' },
      { at: 85, text: 'Verifying high-resolution print vectors...' },
      { at: 100, text: 'Download started successfully!' }
    ];

    downloadTimer = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 12;
      if (currentProgress > 100) currentProgress = 100;

      if (toastProgressFill) toastProgressFill.style.width = currentProgress + '%';
      if (toastPercent) toastPercent.textContent = currentProgress + '%';

      const currentStep = steps.find(s => currentProgress <= s.at) || steps[steps.length - 1];
      if (currentStep && toastStatusText) toastStatusText.textContent = currentStep.text;

      if (currentProgress >= 100) {
        clearInterval(downloadTimer);
        downloadTimer = null;

        setTimeout(() => {
          if (downloadToast) downloadToast.classList.remove('is-active');
        }, 3200);
      }
    }, 140);
  }

  if (downloadMenuBtn) {
    downloadMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      triggerDownloadSimulation();
    });
  }

  if (closeDownloadToast) {
    closeDownloadToast.addEventListener('click', () => {
      if (downloadTimer) clearInterval(downloadTimer);
      if (downloadToast) downloadToast.classList.remove('is-active');
    });
  }

});


