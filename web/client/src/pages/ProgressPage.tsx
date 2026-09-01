// Progress — strength line chart + muscle-group pie chart (presentational;
// data/behavior in useProgress).

import {
  IoAnalyticsOutline,
  IoPieChartOutline,
  IoTrendingUp,
} from "react-icons/io5";

import LineChart from "@/components/charts/LineChart";
import PieChart from "@/components/charts/PieChart";
import ExercisePicker from "@/components/logger/ExercisePicker";
import { useProgress } from "@/hooks/use-progress";
import { fromDateKey } from "@/utils/cycle";
import {
  aggregateByMuscle,
  buildExerciseMuscleLookup,
  MUSCLE_COLORS,
  MUSCLE_GROUPS,
} from "@/utils/muscle-groups";

import "./progress.css";

const MAX_POINTS = 10; // keep X-axis labels readable

function formatShortDate(dateKey: string): string {
  return fromDateKey(dateKey).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function ProgressPage() {
  const {
    loading,
    anyData,
    exercise,
    setExercise,
    exerciseList,
    series,
    muscleCounts,
    customs,
    removeCustom,
  } = useProgress();

  // Empty state — no workout data anywhere.
  if (!loading && !anyData) {
    return (
      <div className="screen" data-testid="progress-screen">
        <div className="progress-empty-wrap" data-testid="progress-empty-state">
          <div className="progress-empty-icon">
            <IoTrendingUp />
          </div>
          <div className="progress-empty-title">No progress yet</div>
          <div className="progress-empty-body">
            Log your first workout to see your progress charts!
          </div>
        </div>
      </div>
    );
  }

  // Trim series to the last N points so the X labels don't squash together.
  const trimmedSeries = series.slice(-MAX_POINTS);
  const seriesIsEmpty = trimmedSeries.length === 0;

  const muscleAgg = aggregateByMuscle(
    muscleCounts,
    buildExerciseMuscleLookup(customs),
  );
  const totalSetsLogged = Object.values(muscleCounts).reduce((a, b) => a + b, 0);
  const pieData = MUSCLE_GROUPS.filter((g) => muscleAgg[g] > 0).map((g) => ({
    name: g,
    population: muscleAgg[g],
    color: MUSCLE_COLORS[g],
  }));

  return (
    <div className="screen" data-testid="progress-screen">
      <div className="eyebrow">TRENDS</div>
      <h1 className="display-title" style={{ marginBottom: 24 }}>
        Progress
      </h1>

      {/* Strength progression */}
      <div className="progress-card" data-testid="strength-card">
        <div className="card-label">STRENGTH PROGRESSION</div>
        <div className="card-title">Max weight by session</div>

        <div className="progress-picker-wrap">
          <ExercisePicker
            value={exercise}
            onChange={setExercise}
            exercises={exerciseList}
            onDeleteCustom={removeCustom}
          />
        </div>

        {seriesIsEmpty ? (
          <div className="mini-empty" data-testid="strength-chart-empty">
            <IoAnalyticsOutline />
            <span>No sets logged for {exercise} yet.</span>
          </div>
        ) : (
          <div data-testid="strength-chart">
            <LineChart
              labels={trimmedSeries.map((p) => formatShortDate(p.dateKey))}
              values={trimmedSeries.map((p) => p.maxWeight)}
            />
            <div className="progress-meta-row">
              <span>
                Best:{" "}
                <span className="meta-value">
                  {Math.max(...trimmedSeries.map((p) => p.maxWeight))}
                </span>
              </span>
              <span>
                Sessions:{" "}
                <span className="meta-value">{trimmedSeries.length}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Muscle group distribution */}
      <div className="progress-card" data-testid="muscle-card">
        <div className="card-label">VOLUME BALANCE</div>
        <div className="card-title">Muscle group distribution</div>

        {pieData.length === 0 ? (
          <div className="mini-empty" data-testid="muscle-chart-empty">
            <IoPieChartOutline />
            <span>No sets logged yet across any muscle group.</span>
          </div>
        ) : (
          <div data-testid="muscle-chart">
            <PieChart data={pieData} />
            {/* Custom legend so colors + labels stay tight to the design. */}
            <div className="muscle-legend" data-testid="muscle-legend">
              {pieData.map((slice) => {
                const pct = totalSetsLogged
                  ? Math.round((slice.population / totalSetsLogged) * 100)
                  : 0;
                return (
                  <div
                    key={slice.name}
                    className="legend-row"
                    data-testid={`muscle-legend-${slice.name.toLowerCase()}`}
                  >
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="legend-label">{slice.name}</span>
                    <span className="legend-value">
                      {pct}% · {slice.population}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
