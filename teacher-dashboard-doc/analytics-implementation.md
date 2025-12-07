# Analytics Dashboard Implementation

**Feature**: Teacher Dashboard - Analytics & Insights
**Status**: ✅ Completed
**Date**: November 18, 2025
**Session**: Phase 3 - Analytics & Polish
**Estimated Time**: 2-3 hours
**Actual Time**: ~1 hour

---

## 📋 Table of Contents
1. [Feature Overview](#feature-overview)
2. [Components](#components)
3. [Service Functions](#service-functions)
4. [Charts Implemented](#charts-implemented)
5. [Key Implementation Details](#key-implementation-details)
6. [Files Created/Modified](#files-createdmodified)
7. [Testing Results](#testing-results)

---

## Feature Overview

Teachers can view institution-wide analytics with interactive charts showing:
- **Score trends over time** (line chart)
- **Weak concepts** (bar chart)
- **Student engagement** (pie chart)

### Purpose
- Identify patterns in student performance
- Spot struggling concepts across the institution
- Monitor student engagement levels
- Make data-driven decisions for teaching strategies

### Screenshots
```
┌─────────────────────────────────────────────────────────┐
│  📊 Analytics              [Last 30 Days ▼] [Refresh]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Score Trends                                           │
│  ┌────────────────────────────────────────────────┐    │
│  │  📈 Line chart showing avg score over time    │    │
│  │     Green line, responsive, tooltips           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌───────────────────────┬───────────────────────────┐ │
│  │ Weak Concepts         │ Student Engagement        │ │
│  │ ┌─────────────────┐  │ ┌─────────────────┐       │ │
│  │ │ 📊 Horizontal   │  │ │ 🥧 Pie chart    │       │ │
│  │ │ Bar chart       │  │ │ Active/Inactive │       │ │
│  │ └─────────────────┘  │ └─────────────────┘       │ │
│  └───────────────────────┴───────────────────────────┘ │
│                                                          │
│  Quick Insights:                                        │
│  ┌──────────┬──────────────┬─────────────┐            │
│  │ Avg: 85% │ Weakest: X   │ Active: 12  │            │
│  └──────────┴──────────────┴─────────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Analytics Component

**File**: `src/components/Teacher/Analytics.jsx` (389 lines)

**Features**:
- Three interactive charts (Line, Bar, Pie)
- Date range selector (7/30/90 days)
- Refresh button
- Loading states
- Empty states
- Responsive design
- Quick insights summary

**State Management**:
```javascript
const [scoreTrends, setScoreTrends] = useState([]);
const [conceptAnalytics, setConceptAnalytics] = useState([]);
const [engagementMetrics, setEngagementMetrics] = useState([]);
const [loading, setLoading] = useState(true);
const [timeRange, setTimeRange] = useState('30');
```

**Color Palette** (Duolingo-inspired):
```javascript
const COLORS = {
  primary: '#58CC02',    // Green - positive trend
  secondary: '#1CB0F6',  // Blue - engagement
  warning: '#FFC800',    // Yellow
  danger: '#FF4B4B',     // Red - weak concepts
  purple: '#CE82FF',
  orange: '#FF9600'
};
```

---

## Service Functions

**File**: `src/services/teacherService.js` (Lines 759-930)

### 1. getScoreTrends()

**Purpose**: Get average score over time

**Parameters**:
- `institutionId` (string) - Institution UUID
- `timeRange` (number) - Number of days (7, 30, or 90)

**Returns**: Array of `{date, avg_score, quiz_count}`

**Query Logic**:
1. Fetch all quiz results in date range
2. Group by date
3. Calculate average score per date
4. Sort chronologically

**Example Output**:
```javascript
[
  { date: '2025-11-01', avg_score: 82, quiz_count: 15 },
  { date: '2025-11-02', avg_score: 85, quiz_count: 18 },
  { date: '2025-11-03', avg_score: 88, quiz_count: 20 }
]
```

---

### 2. getConceptAnalytics()

**Purpose**: Get top 10 weakest concepts

**Parameters**:
- `institutionId` (string) - Institution UUID

**Returns**: Array of `{concept_name, avg_mastery, student_count}`

**Query Logic**:
1. Fetch all concept mastery records
2. Group by concept_name
3. Calculate average mastery score
4. Count unique students per concept
5. Sort by avg_mastery (ascending - weakest first)
6. Return top 10

**Example Output**:
```javascript
[
  { concept_name: 'Past Tense', avg_mastery: 45, student_count: 25 },
  { concept_name: 'Present Perfect', avg_mastery: 52, student_count: 22 },
  { concept_name: 'Future Tense', avg_mastery: 58, student_count: 20 }
]
```

---

### 3. getEngagementMetrics()

**Purpose**: Get student engagement (active vs inactive)

**Parameters**:
- `institutionId` (string) - Institution UUID

**Returns**: Array of `{name, value}` for pie chart

**Query Logic**:
1. Fetch all active students
2. Fetch students who took quiz in last 7 days
3. Count unique active student IDs
4. Calculate inactive count (total - active)
5. Return both counts

**Example Output**:
```javascript
[
  { name: 'Active (Last 7 Days)', value: 12 },
  { name: 'Inactive', value: 8 }
]
```

**Definition of "Active"**: Student who took at least one quiz in the last 7 days

---

## Charts Implemented

### 1. Score Trends Chart (Line Chart)

**Library**: recharts - `LineChart`

**Features**:
- Green line (#58CC02)
- Smooth line (monotone)
- Dots on data points
- Custom tooltip showing date, avg score, quiz count
- Y-axis domain: 0-100 (percentage)
- X-axis: Dates

**Empty State**: "No quiz data available"

**Data Format**:
```javascript
<Line
  type="monotone"
  dataKey="avg_score"
  name="Average Score (%)"
  stroke={COLORS.primary}
  strokeWidth={3}
  dot={{ fill: COLORS.primary, r: 4 }}
/>
```

---

### 2. Weak Concepts Chart (Horizontal Bar Chart)

**Library**: recharts - `BarChart` with `layout="vertical"`

**Features**:
- Red bars (#FF4B4B)
- Horizontal layout (concept names on Y-axis)
- Custom tooltip showing concept, avg mastery, student count
- Shows top 10 weakest concepts
- Sorted ascending (weakest first)

**Empty State**: "No concept data available"

**Data Format**:
```javascript
<Bar
  dataKey="avg_mastery"
  name="Avg Mastery (%)"
  fill={COLORS.danger}
  radius={[0, 4, 4, 0]}  // Rounded right corners
/>
```

---

### 3. Student Engagement Chart (Pie Chart)

**Library**: recharts - `PieChart`

**Features**:
- Two slices: Active (green) and Inactive (red)
- Labels showing percentage
- Custom tooltip
- Stats cards below pie chart
- Color indicators matching pie slices

**Empty State**: "No students enrolled"

**Data Format**:
```javascript
<Pie
  data={engagementMetrics}
  cx="50%"
  cy="50%"
  labelLine={false}
  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
  outerRadius={80}
  dataKey="value"
>
  <Cell fill={COLORS.primary} />  {/* Active */}
  <Cell fill={COLORS.danger} />   {/* Inactive */}
</Pie>
```

---

## Key Implementation Details

### Date Range Selector

**UI Element**: Dropdown with icon

```jsx
<select
  value={timeRange}
  onChange={(e) => setTimeRange(e.target.value)}
  className="..."
>
  <option value="7">Last 7 Days</option>
  <option value="30">Last 30 Days</option>
  <option value="90">Last 90 Days</option>
</select>
```

**Behavior**: Triggers `loadAnalytics()` on change via `useEffect([timeRange])`

---

### Loading States

**Skeleton Loader**:
```jsx
<div className="animate-pulse space-y-4">
  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
  <div className="h-64 bg-gray-200 rounded"></div>
</div>
```

Shown for: 3 chart containers while data is loading

---

### Empty States

**Pattern**: Check if data array is empty before rendering chart

**Example**:
```jsx
{scoreTrends.length === 0 ? (
  <div className="h-64 flex items-center justify-center">
    <div className="text-center">
      <p className="font-semibold">No quiz data available</p>
      <p className="text-sm">Students need to take quizzes</p>
    </div>
  </div>
) : (
  <ResponsiveContainer>
    <LineChart data={scoreTrends}>...</LineChart>
  </ResponsiveContainer>
)}
```

---

### Custom Tooltips

**Purpose**: Show detailed information on hover

**Example**:
```jsx
const ScoreTrendTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="text-sm font-semibold">{payload[0].payload.date}</p>
        <p className="text-sm">Avg Score: {payload[0].value}%</p>
        <p className="text-sm">Quizzes: {payload[0].payload.quiz_count}</p>
      </div>
    );
  }
  return null;
};
```

**Usage**: `<Tooltip content={<ScoreTrendTooltip />} />`

---

### Responsive Charts

**Pattern**: Use `ResponsiveContainer` from recharts

```jsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={scoreTrends}>
    {/* Chart components */}
  </LineChart>
</ResponsiveContainer>
```

**Benefits**:
- Automatically adjusts to container width
- Maintains aspect ratio
- Works on mobile and desktop

---

### Quick Insights Summary

**Purpose**: Show key metrics at a glance

**Layout**: Three cards in a row

**Metrics Calculated**:
1. **Average Score**: Mean of all `avg_score` in `scoreTrends`
2. **Weakest Concept**: First item in `conceptAnalytics` (sorted weakest first)
3. **Active Students**: Count from `engagementMetrics`

**Design**: Gradient background (green-50 to blue-50) with white cards

---

## Files Created/Modified

### New Files

1. **`src/components/Teacher/Analytics.jsx`** (389 lines)
   - Main analytics component
   - Three interactive charts
   - Date range selector
   - Loading/empty states

### Modified Files

1. **`src/services/teacherService.js`** (Lines 759-930)
   - Added `getScoreTrends()`
   - Added `getConceptAnalytics()`
   - Added `getEngagementMetrics()`

2. **`src/components/Teacher/Dashboard.jsx`** (Lines 26, 143)
   - Imported Analytics component
   - Replaced AnalyticsTabPlaceholder with Analytics

3. **`package.json`**
   - Added `recharts` dependency

**Total New Code**: ~380 lines

---

## Testing Results

### ✅ Test 1: Charts Render Correctly
- [x] Line chart displays with correct data
- [x] Bar chart displays with correct data
- [x] Pie chart displays with correct data
- [x] All charts are responsive

### ✅ Test 2: Date Range Selector
- [x] Dropdown shows 3 options (7/30/90 days)
- [x] Changing date range refetches data
- [x] Data updates correctly for each range

### ✅ Test 3: Loading States
- [x] Skeleton loaders show while fetching
- [x] Loaders disappear when data loads
- [x] Smooth transition from loading to data

### ✅ Test 4: Empty States
- [x] Empty state shows when no quiz data
- [x] Empty state shows when no concept data
- [x] Empty state shows when no students enrolled
- [x] Messages are helpful and actionable

### ✅ Test 5: Tooltips
- [x] Hover shows detailed information
- [x] Tooltips display correct data
- [x] Tooltips are styled correctly

### ✅ Test 6: Quick Insights
- [x] Average score calculates correctly
- [x] Weakest concept displays correctly
- [x] Active students count is accurate

### ✅ Test 7: Responsive Design
- [x] Charts work on desktop
- [x] Charts work on tablet
- [x] Charts work on mobile
- [x] Layout adjusts appropriately

### ✅ Test 8: Refresh Button
- [x] Refresh button refetches all data
- [x] Loading state shows during refresh
- [x] Data updates correctly

---

## Key Learnings

### 1. Recharts Library
**Learning**: Recharts is powerful but requires understanding of ResponsiveContainer

**Best Practice**: Always wrap charts in ResponsiveContainer for responsive design

```jsx
// ✅ Good
<ResponsiveContainer width="100%" height={300}>
  <LineChart>...</LineChart>
</ResponsiveContainer>

// ❌ Bad
<LineChart width={800} height={300}>...</LineChart>
```

---

### 2. Data Grouping Pattern
**Learning**: JavaScript grouping is powerful for analytics

**Pattern**:
```javascript
const groupedByDate = {};
data.forEach(item => {
  if (!groupedByDate[item.date]) {
    groupedByDate[item.date] = { scores: [], count: 0 };
  }
  groupedByDate[item.date].scores.push(item.score);
  groupedByDate[item.date].count++;
});
```

**Application**: Used in `getScoreTrends()` and `getConceptAnalytics()`

---

### 3. Empty State Handling
**Learning**: Always check for empty data before rendering charts

**Pattern**:
```javascript
{data.length === 0 ? <EmptyState /> : <Chart data={data} />}
```

**Why**: Prevents chart rendering errors and improves UX

---

### 4. Custom Tooltips
**Learning**: Default tooltips are ugly, custom tooltips are worth the effort

**Implementation**: Create component that checks `active` and `payload`

**Result**: Professional, informative tooltips

---

### 5. Parallel Data Fetching
**Learning**: Use `Promise.all()` to fetch multiple datasets simultaneously

**Performance**:
```javascript
// ❌ Sequential (3 seconds)
const trends = await getScoreTrends();
const concepts = await getConceptAnalytics();
const engagement = await getEngagementMetrics();

// ✅ Parallel (1 second)
const [trends, concepts, engagement] = await Promise.all([
  getScoreTrends(),
  getConceptAnalytics(),
  getEngagementMetrics()
]);
```

---

### 6. Set for Unique Counts
**Learning**: Use `Set` to count unique items

**Example**:
```javascript
const uniqueStudents = new Set(data.map(r => r.student_id));
const activeCount = uniqueStudents.size;
```

**Application**: Used in `getEngagementMetrics()` and `getConceptAnalytics()`

---

## Next Steps

- ✅ Analytics dashboard complete
- ⏭️ Add export functionality (download charts as PNG)
- ⏭️ Add CSV export for data
- ⏭️ Add more analytics (class-level comparison, time-of-day patterns)
- ⏭️ Add filters (by class, by student)
- ⏭️ Add drill-down (click concept → see students)

---

## Dependencies

**New Package Installed**:
```json
{
  "recharts": "^2.x.x"
}
```

**Install Command**:
```bash
npm install recharts
```

**Size**: ~39 packages added

---

**Documentation by**: Claude Code
**Last Updated**: November 18, 2025
**Status**: ✅ Complete - Ready for Production
