
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import {
  Wind,
  Activity,
  Target,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Zap,
} from "lucide-react";

import "./App.css";

// Set VITE_API_URL in frontend/.env for local development or deployment.
const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  ""
);

function formatNumber(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";

  return Number(value).toLocaleString("en-GB", {
    maximumFractionDigits: 1,
  });
}

function formatTime(value) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

function MetricCard({ title, value, unit, description, icon: Icon }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{title}</span>
        <div className="metric-icon">
          <Icon size={19} />
        </div>
      </div>

      <div className="metric-value">
        {value}
        <span>{unit}</span>
      </div>

      <p className="metric-description">{description}</p>
    </article>
  );
}

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

export default function App() {
  const [overview, setOverview] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("all");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        `${API}/api/overview`,
        `${API}/api/forecast`,
        `${API}/api/daily`,
      ];

      const responses = await Promise.all(
        endpoints.map((url) => fetch(url))
      );

      for (const response of responses) {
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
      }

      const [overviewData, forecastData, dailyData] = await Promise.all(
        responses.map((response) => response.json())
      );

      setOverview(overviewData);
      setForecast(forecastData.data || []);
      setDaily(dailyData.data || []);
    } catch (err) {
      setError(
        `${err.message}. Make sure the Python backend is running at ${API}.`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const visibleForecast = forecast.filter((row) => {
    if (selectedDate === "all") return true;
    return row.time.slice(0, 10) === selectedDate;
  });

  const chartData = visibleForecast.map((row) => ({
    ...row,
    timeLabel: new Date(row.time).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }),
  }));

  const metrics = overview?.metrics;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Wind size={25} />
          </div>

          <div>
            <strong>
              WIND<span>WISE</span>
            </strong>
            <small>ENERGY INTELLIGENCE</small>
          </div>
        </div>

        <div className="side-section-label">WORKSPACE</div>

        <div className="nav-item active">
          <Activity size={18} />
          <span>Forecast overview</span>
        </div>

        <div className="sidebar-note">
          <div className="status-dot" />
          <div>
            <strong>Historical analysis</strong>
            <p>UK national wind generation</p>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="mini-icon">
            <Zap size={17} />
          </div>

          <div>
            <strong>Decision intelligence</strong>
            <p>Forecasts compared with actual generation.</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Analytics <span>/</span> Wind generation
          </div>

          <div className="topbar-right">
            <span className="live-indicator">
              <span className="status-dot" />
              {error ? "CONNECTION ISSUE" : "DATA CONNECTED"}
            </span>

            <button
              className="refresh-button"
              onClick={loadDashboard}
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={loading ? "spinning" : ""}
              />
              Refresh
            </button>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">NATIONAL ENERGY · GREAT BRITAIN</div>
            <h1>Wind forecast intelligence</h1>

            <p className="page-subtitle">
              Understand forecast accuracy, generation patterns, and
              prediction errors.
            </p>
          </div>

          <div className="period-badge">
            <span>ANALYSIS PERIOD</span>
            <strong>01 — 31 JAN 2026</strong>
            <small>UTC · Historical data</small>
          </div>
        </section>

        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <div>
              <strong>Unable to load dashboard data</strong>
              <p>{error}</p>
            </div>

            <button onClick={loadDashboard}>Retry</button>
          </div>
        )}

        {loading && !overview && (
          <div className="loading-panel">
            <div className="loader" />
            <strong>Loading energy intelligence...</strong>
            <p>Connecting to the forecast analytics API.</p>
          </div>
        )}

        {overview && metrics && (
          <>
            <section className="metric-grid">
              <MetricCard
                title="Mean absolute error"
                value={formatNumber(metrics.mae_mw)}
                unit="MW"
                description="Average absolute prediction error"
                icon={Target}
              />

              <MetricCard
                title="Root mean squared error"
                value={formatNumber(metrics.rmse_mw)}
                unit="MW"
                description="Penalises larger prediction errors"
                icon={Activity}
              />

              <MetricCard
                title="Forecast bias"
                value={formatNumber(metrics.bias_mw)}
                unit="MW"
                description={
                  metrics.bias_mw > 0
                    ? "Positive · forecasts overestimate"
                    : metrics.bias_mw < 0
                      ? "Negative · forecasts underestimate"
                      : "No average directional bias"
                }
                icon={TrendingUp}
              />

              <MetricCard
                title="Evaluated periods"
                value={formatNumber(metrics.periods_evaluated)}
                unit="/ 744"
                description="Hourly periods with eligible forecasts"
                icon={Wind}
              />
            </section>

            <section className="insight-banner">
              <div className="insight-symbol">
                <Activity size={22} />
              </div>

              <div className="insight-copy">
                <strong>Forecast performance at a glance</strong>

                <p>
                  Average actual generation was{" "}
                  <b>{formatNumber(metrics.mean_actual_mw)} MW</b>, compared
                  with forecast generation of{" "}
                  <b>{formatNumber(metrics.mean_forecast_mw)} MW</b>.
                  The mean forecast error was{" "}
                  <b>{formatNumber(metrics.bias_mw)} MW</b>.
                </p>
              </div>

              <div className="insight-tag">
                {metrics.bias_mw > 0
                  ? "OVERFORECASTING"
                  : metrics.bias_mw < 0
                    ? "UNDERFORECASTING"
                    : "BALANCED"}
              </div>
            </section>

            <ChartCard
              title="Forecast vs. actual generation"
              subtitle="Hourly national wind generation · MW · UTC"
              className="main-chart-panel"
            >
              <div className="chart-toolbar">
                <span>
                  {visibleForecast.length.toLocaleString()} hourly observations
                </span>

                <select
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  aria-label="Filter by date"
                >
                  <option value="all">Entire month</option>

                  {daily.map((day) => (
                    <option key={day.date} value={day.date}>
                      {day.date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="chart-container large-chart">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="actualGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#3cd6b0"
                            stopOpacity={0.22}
                          />
                          <stop
                            offset="100%"
                            stopColor="#3cd6b0"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 5"
                        stroke="#263447"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="time"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            timeZone: "UTC",
                          })
                        }
                        minTickGap={45}
                        stroke="#8290a4"
                        tick={{ fontSize: 11 }}
                      />

                      <YAxis
                        stroke="#8290a4"
                        width={65}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) =>
                          `${(value / 1000).toFixed(0)}k`
                        }
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#101c2a",
                          border: "1px solid #304055",
                          borderRadius: 10,
                          color: "#edf4fc",
                        }}
                        labelFormatter={formatTime}
                        formatter={(value, name) => [
                          `${formatNumber(value)} MW`,
                          name,
                        ]}
                      />

                      <Legend />

                      <Area
                        type="monotone"
                        dataKey="actual_mw"
                        name="Actual generation"
                        stroke="#3cd6b0"
                        strokeWidth={2}
                        fill="url(#actualGradient)"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />

                      <Area
                        type="monotone"
                        dataKey="forecast_mw"
                        name="Forecast generation"
                        stroke="#8b8aff"
                        strokeWidth={2}
                        fill="transparent"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-chart">
                    No matching hourly observations.
                  </div>
                )}
              </div>
            </ChartCard>

            <div className="chart-grid">
              <ChartCard
                title="Daily generation profile"
                subtitle="Average forecast and actual MW per day"
              >
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={daily}
                      margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 5"
                        stroke="#263447"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => value.slice(8)}
                        stroke="#8290a4"
                        tick={{ fontSize: 10 }}
                      />

                      <YAxis
                        stroke="#8290a4"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) =>
                          `${(value / 1000).toFixed(0)}k`
                        }
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#101c2a",
                          border: "1px solid #304055",
                          borderRadius: 10,
                        }}
                      />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="actual_mw"
                        name="Actual"
                        stroke="#3cd6b0"
                        strokeWidth={2}
                        dot={false}
                      />

                      <Line
                        type="monotone"
                        dataKey="forecast_mw"
                        name="Forecast"
                        stroke="#8b8aff"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard
                title="Daily forecast error"
                subtitle="Mean absolute error per day · MW"
              >
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={daily}
                      margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 5"
                        stroke="#263447"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => value.slice(8)}
                        stroke="#8290a4"
                        tick={{ fontSize: 10 }}
                      />

                      <YAxis
                        stroke="#8290a4"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) =>
                          `${(value / 1000).toFixed(1)}k`
                        }
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#101c2a",
                          border: "1px solid #304055",
                          borderRadius: 10,
                        }}
                        formatter={(value) => [
                          `${formatNumber(value)} MW`,
                          "MAE",
                        ]}
                      />

                      <Bar
                        dataKey="mae_mw"
                        name="Mean absolute error"
                        fill="#8b8aff"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            <ChartCard
              title="Daily performance breakdown"
              subtitle="Compare daily averages and error metrics"
              className="table-panel"
            >
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>ACTUAL MW</th>
                      <th>FORECAST MW</th>
                      <th>MAE MW</th>
                      <th>BIAS MW</th>
                      <th>HOURS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {daily.map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>{formatNumber(row.actual_mw)}</td>
                        <td>{formatNumber(row.forecast_mw)}</td>
                        <td>{formatNumber(row.mae_mw)}</td>

                        <td
                          className={
                            row.bias_mw > 0
                              ? "positive"
                              : row.bias_mw < 0
                                ? "negative"
                                : ""
                          }
                        >
                          {row.bias_mw > 0 ? "+" : ""}
                          {formatNumber(row.bias_mw)}
                        </td>

                        <td>{row.hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>

            <footer className="footer">
              <div className="footer-brand">
                <Wind size={16} />
                WINDWISE ANALYTICS
              </div>

              <span>Source: Elexon BMRS · FUELHH & WINDFOR</span>
              <span>January 2026 · UTC · MW</span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

