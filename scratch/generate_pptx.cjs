const path = require('path');
const pptxgen = require(path.join(__dirname, '..', 'web-admin', 'node_modules', 'pptxgenjs'));

async function createDeck() {
  const pptx = new pptxgen();

  // ── Standard 16:9 Modern Presentation Layout (13.333" x 7.5") ──────────
  pptx.defineLayout({ name: 'WIDE_16_9', width: 13.333, height: 7.5 });
  pptx.layout = 'WIDE_16_9';

  pptx.title = 'MessWise OS — Hackathon Pitch Deck';
  pptx.author = 'MessWise Team';

  // ── Theme Colors ────────────────────────────────────────────────────────
  const DARK_BG = '0F172A';
  const LIGHT_BG = 'F8FAFC';
  const CARD_BG = 'FFFFFF';
  const BORDER_COLOR = 'E2E8F0';
  const EMERALD = '10B981';
  const EMERALD_DARK = '065F46';
  const EMERALD_LIGHT = 'ECFDF5';
  const TEXT_DARK = '0F172A';
  const TEXT_MUTED = '64748B';
  const TEXT_LIGHT = 'F8FAFC';
  const AMBER = 'F59E0B';
  const BLUE = '2563EB';
  const RED = 'DC2626';

  // ─────────────────────────────────────────────────────────────────────────
  // SLIDE 1: Title Slide (Dark Theme)
  // ─────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: DARK_BG };

    // Top Accent Bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 13.333, h: 0.12,
      fill: { color: EMERALD },
      line: { color: EMERALD }
    });

    // Hackathon Pill Badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.9, y: 0.9, w: 4.8, h: 0.45, r: 0.2,
      fill: { color: '132E27' },
      line: { color: EMERALD, width: 1.2 }
    });
    slide.addText('HACKATHON 2026 • SMART CAMPUS & SUSTAINABILITY', {
      x: 0.9, y: 0.9, w: 4.8, h: 0.45,
      fontSize: 9.5, fontFace: 'Arial', bold: true,
      color: EMERALD, align: 'center', valign: 'middle'
    });

    // Main Title
    slide.addText('MessWise OS', {
      x: 0.9, y: 1.65, w: 11.5, h: 1.1,
      fontSize: 52, fontFace: 'Arial', bold: true,
      color: TEXT_LIGHT, margin: 0
    });

    // Subtitle
    slide.addText('The Real-Time Operating System for Sustainable Campus Dining & Hostel Facilities', {
      x: 0.9, y: 2.75, w: 11.5, h: 0.6,
      fontSize: 18, fontFace: 'Arial', color: '94A3B8'
    });

    // Divider line
    slide.addShape(pptx.ShapeType.line, {
      x: 0.9, y: 3.6, w: 11.5, h: 0,
      line: { color: '334155', width: 1.5 }
    });

    // Value Prop Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.9, y: 3.9, w: 11.5, h: 1.6, r: 0.12,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1.2 }
    });
    slide.addText([
      { text: 'Core Mission:\n', options: { bold: true, color: EMERALD, fontSize: 13 } },
      { text: 'Eliminating 35%+ hostel food wastage through predictive 3-hour cutoff attendance, flattening peak dining hall queues with live crowd meters, and automating hostel maintenance SLAs with zero-latency Firebase sync.', options: { color: 'CBD5E1', fontSize: 11.5 } }
    ], {
      x: 1.2, y: 4.05, w: 10.9, h: 1.3,
      fontFace: 'Arial', lineSpacing: 18, wrap: true, valign: 'top'
    });

    // Footer
    slide.addText('Presenter: MessWise Team  |  Android (Kotlin & Compose) + Web (Next.js 14) + Cloud Firestore', {
      x: 0.9, y: 6.2, w: 11.5, h: 0.4,
      fontSize: 11, fontFace: 'Arial', color: '64748B'
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SLIDE 2: The Problem
  // ─────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };

    slide.addText('THE PROBLEM', {
      x: 0.8, y: 0.45, w: 11.7, h: 0.3,
      fontSize: 11, fontFace: 'Arial', bold: true, color: EMERALD, charSpacing: 2
    });
    slide.addText('The 3 Crises in Campus Mess & Hostel Operations', {
      x: 0.8, y: 0.75, w: 11.7, h: 0.55,
      fontSize: 24, fontFace: 'Arial', bold: true, color: TEXT_DARK
    });

    const problems = [
      {
        icon: '🗑️',
        title: 'Blind Bulk Cooking & Waste',
        stat: '35% – 40%',
        statDesc: 'Cooked food thrown away daily',
        desc: 'Kitchen staff cook on rough estimates because students skip meals or eat outside without notice. Hundreds of kilograms of fresh food end up in dumpsters every single day.'
      },
      {
        icon: '⏳',
        title: 'Peak-Hour Queue Chaos',
        stat: '45+ Mins',
        statDesc: 'Peak dining wait times',
        desc: '500+ students rush into mess halls at the exact same minute. Long chaotic queues cause frustration, schedule delays, and wasted student study hours.'
      },
      {
        icon: '📋',
        title: 'Broken Hostel Facilities',
        stat: '3 – 7 Days',
        statDesc: 'Average maintenance resolution',
        desc: 'Plumbing leaks, broken fans, and electrical faults sit neglected in manual paper logbooks with zero technician accountability or SLA visibility.'
      }
    ];

    problems.forEach((p, idx) => {
      const xPos = 0.8 + idx * 4.0;
      
      slide.addShape(pptx.ShapeType.roundRect, {
        x: xPos, y: 1.55, w: 3.7, h: 5.2, r: 0.12,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.5 }
      });

      slide.addText(p.icon, {
        x: xPos + 0.3, y: 1.8, w: 0.8, h: 0.45,
        fontSize: 24
      });

      slide.addText(p.title, {
        x: xPos + 0.3, y: 2.35, w: 3.1, h: 0.55,
        fontSize: 14, fontFace: 'Arial', bold: true, color: TEXT_DARK, wrap: true
      });

      slide.addText(p.stat, {
        x: xPos + 0.3, y: 3.0, w: 3.1, h: 0.5,
        fontSize: 26, fontFace: 'Arial', bold: true, color: RED
      });
      slide.addText(p.statDesc, {
        x: xPos + 0.3, y: 3.5, w: 3.1, h: 0.3,
        fontSize: 9.5, fontFace: 'Arial', bold: true, color: TEXT_MUTED, charSpacing: 1
      });

      slide.addText(p.desc, {
        x: xPos + 0.3, y: 4.0, w: 3.1, h: 2.4,
        fontSize: 10.5, fontFace: 'Arial', color: '475569', lineSpacing: 15, wrap: true, valign: 'top'
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SLIDE 3: The Solution
  // ─────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };

    slide.addText('THE SOLUTION', {
      x: 0.8, y: 0.45, w: 11.7, h: 0.3,
      fontSize: 11, fontFace: 'Arial', bold: true, color: EMERALD, charSpacing: 2
    });
    slide.addText('MessWise OS: Dual-Platform Real-Time Synchronization', {
      x: 0.8, y: 0.75, w: 11.7, h: 0.55,
      fontSize: 24, fontFace: 'Arial', bold: true, color: TEXT_DARK
    });

    // Left: Student App
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.55, w: 5.65, h: 5.2, r: 0.12,
      fill: { color: CARD_BG },
      line: { color: EMERALD, width: 2 }
    });
    slide.addText('📱 STUDENT MOBILE APP (Android Kotlin & Compose)', {
      x: 1.1, y: 1.8, w: 5.05, h: 0.4,
      fontSize: 12.5, fontFace: 'Arial', bold: true, color: EMERALD_DARK
    });
    slide.addText([
      { text: '• 1-Tap Skip/Eat Response: ', options: { bold: true, color: TEXT_DARK } },
      { text: 'Students toggle meal attendance with 1 tap, respecting a strict 3-hour cutoff.\n\n', options: { color: '475569' } },
      { text: '• Gamified Green Points: ', options: { bold: true, color: TEXT_DARK } },
      { text: 'Students earn +15 Green Points for advance skips, redeemable for canteen rewards.\n\n', options: { color: '475569' } },
      { text: '• Live Crowd Rush Meter: ', options: { bold: true, color: TEXT_DARK } },
      { text: 'Check real-time rush levels (🟢 Low, 🟡 Moderate, 🔴 Peak) before walking over.\n\n', options: { color: '475569' } },
      { text: '• Emergency Push Banners: ', options: { bold: true, color: TEXT_DARK } },
      { text: 'Instant emergency alerts with pulsing crimson badges and warden notices.\n\n', options: { color: '475569' } },
      { text: '• Maintenance Reporting: ', options: { bold: true, color: TEXT_DARK } },
      { text: 'In-app room issue ticketing with photo upload and live resolution tracking.', options: { color: '475569' } }
    ], {
      x: 1.1, y: 2.3, w: 5.05, h: 4.2,
      fontSize: 10, fontFace: 'Arial', lineSpacing: 14, wrap: true, valign: 'top'
    });

    // Right: Web Admin Command Center
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 6.85, y: 1.55, w: 5.65, h: 5.2, r: 0.12,
      fill: { color: CARD_BG },
      line: { color: BLUE, width: 2 }
    });
    slide.addText('💻 ADMIN COMMAND CENTER (Next.js 14 & Tailwind)', {
      x: 7.15, y: 1.8, w: 5.05, h: 0.4,
      fontSize: 12.5, fontFace: 'Arial', bold: true, color: '1E40AF'
    });
    slide.addText([
      { text: '• Kitchen Head Forecasting: ', options: { bold: true, color: TEXT_DARK } },
      { text: 'Predictive headcount calculator automatically adjusts daily cooking quantities.\n\n', options: { color: '475569' } },
      { text: '• 7-Day Interactive Timetable: ', options: { bold: true, color: TEXT_DARK } },
      { text: 'Weekly menu planner with 1-click Random Timetable Generator & nutrition data.\n\n', options: { color: '475569' } },
      { text: '• Warden SLA Board: ', options: { bold: true, color: TEXT_DARK } },
      { text: 'Manage tickets sorted by urgency and room block; 1-click technician dispatch.\n\n', options: { color: '475569' } },
      { text: '• Broadcast Dispatcher: ', options: { bold: true, color: TEXT_DARK } },
      { text: 'Broadcast campus-wide notices with instant delivery to student devices.\n\n', options: { color: '475569' } },
      { text: '• Multi-Tenant Directory: ', options: { bold: true, color: TEXT_DARK } },
      { text: 'Manage student VIDs, room numbers, and hostel blocks in one place.', options: { color: '475569' } }
    ], {
      x: 7.15, y: 2.3, w: 5.05, h: 4.2,
      fontSize: 10, fontFace: 'Arial', lineSpacing: 14, wrap: true, valign: 'top'
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SLIDE 4: Core Innovations
  // ─────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };

    slide.addText('CORE INNOVATIONS', {
      x: 0.8, y: 0.45, w: 11.7, h: 0.3,
      fontSize: 11, fontFace: 'Arial', bold: true, color: EMERALD, charSpacing: 2
    });
    slide.addText('Behavioral Economics & Intelligent Campus Operations', {
      x: 0.8, y: 0.75, w: 11.7, h: 0.55,
      fontSize: 24, fontFace: 'Arial', bold: true, color: TEXT_DARK
    });

    const innovations = [
      {
        num: '01',
        title: '3-Hour Cutoff Rule',
        badge: 'Predictive Accuracy',
        desc: 'Students cannot opt out within 3 hours of meal start. This hard operational boundary guarantees the kitchen crew a locked-in, reliable headcount before food prep begins.'
      },
      {
        num: '02',
        title: 'Gamified Green Points',
        badge: 'Behavioral Incentive',
        desc: 'Instead of penalizing non-attendance, MessWise OS rewards advance notification with +15 Green Points per skipped meal. Points redeem for canteen perks, creating high organic adoption.'
      },
      {
        num: '03',
        title: 'Live Crowd Rush Meter',
        badge: 'Traffic Shaping',
        desc: 'Real-time rush indicator (🟢 Low, 🟡 Moderate, 🔴 Peak) with estimated wait times in minutes. Flattens crowd congestion by encouraging students to dine during off-peak windows.'
      },
      {
        num: '04',
        title: 'Pulsing Broadcasts',
        badge: 'Instant Safety Alert',
        desc: 'Sub-second emergency delivery pushed to active student screens with pulsating crimson visual alert badges, replacing outdated paper notices that go unread.'
      }
    ];

    innovations.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const xPos = 0.8 + col * 6.0;
      const yPos = 1.55 + row * 2.65;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: xPos, y: yPos, w: 5.7, h: 2.4, r: 0.12,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.5 }
      });

      slide.addText(item.num, {
        x: xPos + 0.3, y: yPos + 0.2, w: 0.6, h: 0.35,
        fontSize: 16, fontFace: 'Arial', bold: true, color: EMERALD
      });

      slide.addText(item.title, {
        x: xPos + 0.9, y: yPos + 0.2, w: 3.2, h: 0.35,
        fontSize: 13.5, fontFace: 'Arial', bold: true, color: TEXT_DARK
      });

      slide.addText(item.badge, {
        x: xPos + 4.1, y: yPos + 0.22, w: 1.4, h: 0.28,
        fontSize: 7.5, fontFace: 'Arial', bold: true, color: '0369A1', align: 'right'
      });

      slide.addText(item.desc, {
        x: xPos + 0.3, y: yPos + 0.65, w: 5.1, h: 1.55,
        fontSize: 10, fontFace: 'Arial', color: '475569', lineSpacing: 14, wrap: true, valign: 'top'
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SLIDE 5: Technical Architecture
  // ─────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };

    slide.addText('ARCHITECTURE & TECH STACK', {
      x: 0.8, y: 0.45, w: 11.7, h: 0.3,
      fontSize: 11, fontFace: 'Arial', bold: true, color: EMERALD, charSpacing: 2
    });
    slide.addText('Robust, Reactive, Multi-Tenant Cloud Architecture', {
      x: 0.8, y: 0.75, w: 11.7, h: 0.55,
      fontSize: 24, fontFace: 'Arial', bold: true, color: TEXT_DARK
    });

    const techTiers = [
      {
        title: '📱 Mobile Client',
        tech: 'Android • Kotlin • Compose',
        points: [
          'Material 3 modern UI components',
          'Flow-based snapshot observation',
          'Hilt Dependency Injection',
          'Offline caching via Firestore'
        ]
      },
      {
        title: '💻 Web Admin Center',
        tech: 'Next.js 14 • React • Tailwind',
        points: [
          'Next.js 14 App Router (TypeScript)',
          'Tailwind CSS responsive design',
          'Fast hot reload & dynamic portals',
          'Multi-collection snapshot hooks'
        ]
      },
      {
        title: '☁️ Cloud Backend',
        tech: 'Firebase Firestore • Auth',
        points: [
          'Native database: "default"',
          'Real-time snapshot listeners',
          'Multi-tenant schema partitioning',
          'Zero-latency push to devices'
        ]
      },
      {
        title: '🔒 Security & RBAC',
        tech: 'Firestore Security Rules',
        points: [
          'Public read for menus & notices',
          'Strict student write isolation (VID)',
          'Admin-only write gating',
          'Secure multi-hostel separation'
        ]
      }
    ];

    techTiers.forEach((tier, idx) => {
      const xPos = 0.8 + idx * 2.95;
      
      slide.addShape(pptx.ShapeType.roundRect, {
        x: xPos, y: 1.55, w: 2.8, h: 5.2, r: 0.12,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.5 }
      });

      slide.addText(tier.title, {
        x: xPos + 0.2, y: 1.75, w: 2.4, h: 0.4,
        fontSize: 12.5, fontFace: 'Arial', bold: true, color: TEXT_DARK
      });

      slide.addText(tier.tech, {
        x: xPos + 0.2, y: 2.15, w: 2.4, h: 0.45,
        fontSize: 9, fontFace: 'Arial', bold: true, color: EMERALD
      });

      const bulletList = tier.points.map(pt => ({ text: `• ${pt}\n\n`, options: { color: '475569' } }));
      slide.addText(bulletList, {
        x: xPos + 0.2, y: 2.7, w: 2.4, h: 3.8,
        fontSize: 9.5, fontFace: 'Arial', lineSpacing: 14, wrap: true, valign: 'top'
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SLIDE 6: 2-Minute Live Demo Flow
  // ─────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };

    slide.addText('LIVE DEMONSTRATION', {
      x: 0.8, y: 0.45, w: 11.7, h: 0.3,
      fontSize: 11, fontFace: 'Arial', bold: true, color: EMERALD, charSpacing: 2
    });
    slide.addText('Step-by-Step 2-Minute Judge Pitch Flow', {
      x: 0.8, y: 0.75, w: 11.7, h: 0.55,
      fontSize: 24, fontFace: 'Arial', bold: true, color: TEXT_DARK
    });

    const steps = [
      {
        step: 'STEP 1 (15s)',
        title: 'Kitchen Head Forecast View',
        desc: 'Open Web Admin (http://localhost:3000) Kitchen Portal. Show today’s forecasted student count and the 7-day balanced timetable with calories and allergen tags.'
      },
      {
        step: 'STEP 2 (30s)',
        title: 'Student Opt-Out & Green Points',
        desc: 'Open Android app (Student Utkarsh, VID001). Tap "Skip" on Lunch. The +15 Green Points badge increments instantly! Demonstrate 3-hour cutoff enforcement.'
      },
      {
        step: 'STEP 3 (40s)',
        title: 'The "WOW" Moment: Live Broadcast',
        desc: 'Warden Portal: Select 🚨 Emergency, type "Water supply maintenance in Block-A: 2 PM – 4 PM today." Click Send. Student phone instantly renders pulsing crimson banner without reload!'
      },
      {
        step: 'STEP 4 (35s)',
        title: 'Maintenance SLA Dispatch',
        desc: 'Student submits plumbing ticket on Android → Pops up on Warden SLA board → Warden clicks Assign → Ticket status updates to IN PROGRESS on student phone in real time.'
      }
    ];

    steps.forEach((s, idx) => {
      const yPos = 1.55 + idx * 1.3;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: yPos, w: 11.7, h: 1.15, r: 0.1,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.2 }
      });

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.0, y: yPos + 0.28, w: 1.6, h: 0.55, r: 0.08,
        fill: { color: EMERALD_LIGHT },
        line: { color: EMERALD, width: 1 }
      });
      slide.addText(s.step, {
        x: 1.0, y: yPos + 0.38, w: 1.6, h: 0.35,
        fontSize: 9, fontFace: 'Arial', bold: true, color: EMERALD_DARK, align: 'center'
      });

      slide.addText(s.title, {
        x: 2.8, y: yPos + 0.18, w: 9.4, h: 0.35,
        fontSize: 12.5, fontFace: 'Arial', bold: true, color: TEXT_DARK
      });

      slide.addText(s.desc, {
        x: 2.8, y: yPos + 0.52, w: 9.4, h: 0.55,
        fontSize: 10, fontFace: 'Arial', color: '475569', lineSpacing: 14, wrap: true, valign: 'top'
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SLIDE 7: Measurable Impact & ROI
  // ─────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };

    slide.addText('IMPACT & METRICS', {
      x: 0.8, y: 0.45, w: 11.7, h: 0.3,
      fontSize: 11, fontFace: 'Arial', bold: true, color: EMERALD, charSpacing: 2
    });
    slide.addText('Quantifiable Sustainability & Operational Returns', {
      x: 0.8, y: 0.75, w: 11.7, h: 0.55,
      fontSize: 24, fontFace: 'Arial', bold: true, color: TEXT_DARK
    });

    const metrics = [
      {
        stat: '35% – 40%',
        label: 'Food Waste Reduction',
        desc: 'Over 25,000 kg of cooked food saved annually per 1,000-student hostel by cooking exact portions based on locked headcounts.',
        color: EMERALD
      },
      {
        stat: '45% Drop',
        label: 'Peak Queue Bottlenecks',
        desc: 'Flattened dining rush curves through real-time crowd congestion visibility and live wait-time indicators.',
        color: BLUE
      },
      {
        stat: '< 1 Second',
        label: 'Emergency Alert Latency',
        desc: 'Zero-latency critical incident communication to all student screens, replacing paper notices that get ignored.',
        color: RED
      },
      {
        stat: '75% Faster',
        label: 'Facility SLA Resolution',
        desc: 'Turnaround on room tickets drops from days to hours with digital technician dispatch and timestamp tracking.',
        color: AMBER
      }
    ];

    metrics.forEach((m, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const xPos = 0.8 + col * 6.0;
      const yPos = 1.55 + row * 2.65;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: xPos, y: yPos, w: 5.7, h: 2.4, r: 0.12,
        fill: { color: CARD_BG },
        line: { color: BORDER_COLOR, width: 1.5 }
      });

      slide.addText(m.stat, {
        x: xPos + 0.35, y: yPos + 0.2, w: 5.0, h: 0.55,
        fontSize: 30, fontFace: 'Arial', bold: true, color: m.color
      });

      slide.addText(m.label, {
        x: xPos + 0.35, y: yPos + 0.8, w: 5.0, h: 0.35,
        fontSize: 12, fontFace: 'Arial', bold: true, color: TEXT_DARK
      });

      slide.addText(m.desc, {
        x: xPos + 0.35, y: yPos + 1.18, w: 5.0, h: 1.05,
        fontSize: 10, fontFace: 'Arial', color: '475569', lineSpacing: 14, wrap: true, valign: 'top'
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SLIDE 8: Future Roadmap & Closing (Dark Theme)
  // ─────────────────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: DARK_BG };

    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 13.333, h: 0.12,
      fill: { color: EMERALD },
      line: { color: EMERALD }
    });

    slide.addText('LOOKING FORWARD', {
      x: 0.9, y: 0.55, w: 11.5, h: 0.3,
      fontSize: 11, fontFace: 'Arial', bold: true, color: EMERALD, charSpacing: 2
    });
    slide.addText('Future Horizons & Scalability Roadmap', {
      x: 0.9, y: 0.85, w: 11.5, h: 0.55,
      fontSize: 24, fontFace: 'Arial', bold: true, color: TEXT_LIGHT
    });

    const roadmapItems = [
      {
        title: '⚖️ IoT Smart Waste Scales',
        desc: 'Integration of IoT load-cell scales under disposal bins to track plate waste telemetry in real time.'
      },
      {
        title: '💳 NFC & RFID Turnstiles',
        desc: 'Tap-to-enter access gates syncing directly with MessWise OS meal opt-in validation.'
      },
      {
        title: '📦 Automated Vendor Ordering',
        desc: 'Direct integration with vegetable and grocery suppliers to order raw ingredients automatically based on predicted headcounts.'
      }
    ];

    roadmapItems.forEach((r, idx) => {
      const xPos = 0.9 + idx * 3.95;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: xPos, y: 1.65, w: 3.65, h: 2.8, r: 0.12,
        fill: { color: '1E293B' },
        line: { color: '334155', width: 1.2 }
      });

      slide.addText(r.title, {
        x: xPos + 0.3, y: 1.9, w: 3.05, h: 0.45,
        fontSize: 13, fontFace: 'Arial', bold: true, color: TEXT_LIGHT
      });

      slide.addText(r.desc, {
        x: xPos + 0.3, y: 2.45, w: 3.05, h: 1.8,
        fontSize: 10.5, fontFace: 'Arial', color: '94A3B8', lineSpacing: 15, wrap: true, valign: 'top'
      });
    });

    // Divider line
    slide.addShape(pptx.ShapeType.line, {
      x: 0.9, y: 4.8, w: 11.5, h: 0,
      line: { color: '334155', width: 1.5 }
    });

    // Closing Statement
    slide.addText('MessWise OS — Transforming campus dining into a sustainable, zero-waste smart ecosystem.', {
      x: 0.9, y: 5.1, w: 11.5, h: 0.5,
      fontSize: 13, fontFace: 'Arial', color: 'CBD5E1'
    });

    // Thank You & Q&A
    slide.addText('Thank You!  |  Questions & Answers', {
      x: 0.9, y: 5.8, w: 11.5, h: 0.8,
      fontSize: 28, fontFace: 'Arial', bold: true, color: EMERALD
    });
  }

  // ── Save Presentation ───────────────────────────────────────────────────
  const outputPath = 'C:\\Users\\codei\\.gemini\\antigravity-ide\\scratch\\messwise-os\\MessWise_OS_Pitch_Deck.pptx';
  await pptx.writeFile({ fileName: outputPath });
  console.log('PRESENTATION_CREATED_SUCCESS:', outputPath);
}

createDeck().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
