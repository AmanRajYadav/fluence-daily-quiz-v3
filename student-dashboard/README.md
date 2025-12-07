# Student Dashboard

**Purpose:** Unified dashboard for students to access all their learning tools and data.

## Directory Structure

```
student-dashboard/
├── components/          # React components for dashboard UI
├── services/            # API services for fetching student data
├── docs/                # Documentation and guides
└── README.md            # This file
```

## Features (Planned)

### Phase 1: Core Dashboard
- [ ] Student profile overview
- [ ] Quiz history with performance metrics
- [ ] Concept mastery progress visualization
- [ ] Daily streak tracking
- [ ] Leaderboard position

### Phase 2: Advanced Features
- [ ] Study schedule with SRS reminders
- [ ] Weak concepts identification
- [ ] Personalized practice quizzes
- [ ] Achievement badges & rewards
- [ ] Progress reports download (PDF)

### Phase 3: Social Features
- [ ] Compare with peers (anonymized)
- [ ] Study groups
- [ ] Challenge friends

## Tech Stack

- **Frontend:** React 19 + TailwindCSS
- **Charts:** Recharts (for performance graphs)
- **State:** React Context API
- **Data:** Supabase (real-time subscriptions)

## Data Sources

### From Supabase:
1. `students` - Profile data
2. `quiz_results` - Quiz attempts history
3. `concept_mastery` - SRS tracking & mastery scores
4. `leaderboard` - Daily rankings
5. `quiz_history` - Historical performance data

## Component Structure (Planned)

```
components/
├── DashboardLayout.jsx      # Main layout wrapper
├── ProfileCard.jsx          # Student profile summary
├── QuizHistoryCard.jsx      # Recent quiz attempts
├── ConceptMasteryChart.jsx  # Mastery progress visualization
├── StreakCounter.jsx        # Daily streak display
├── LeaderboardWidget.jsx    # Leaderboard position
├── UpcomingReviews.jsx      # SRS scheduled reviews
└── PerformanceMetrics.jsx   # Overall stats
```

## Services (Planned)

```
services/
├── dashboardService.js      # Fetch dashboard data
├── performanceService.js    # Calculate metrics
└── analyticsService.js      # Track user interactions
```

## Design Philosophy

**Inspiration:** Duolingo + Khan Academy

- **Simple & Clean:** Minimal clutter, focus on key metrics
- **Visual:** Charts, graphs, progress bars
- **Motivational:** Streaks, badges, leaderboard
- **Actionable:** Clear CTAs (Take Quiz, Review Concepts)

## Implementation Priority

1. **Week 1:** Layout + Profile Card + Quiz History
2. **Week 2:** Concept Mastery Chart + Streak Counter
3. **Week 3:** Leaderboard Widget + Performance Metrics
4. **Week 4:** Polish + Mobile responsiveness

---

**Last Updated:** 2025-12-05
**Status:** Planning Phase
**Owner:** Fluence Engineering Team
